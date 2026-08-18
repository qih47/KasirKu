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
  Utensils,
  Coffee,
  Scissors,
  Shirt,
  ScanBarcode,
  Scale,
  ChefHat,
  Monitor,
  Check,
  Sliders,
} from "lucide-react";
import { PosLayoutType } from "@/types/pos-layout";
import { useDynamicTheme, BUILTIN_THEME_PRESETS } from "@/components/theme/dynamic-theme-provider";
import {
  DynamicReceiptRenderer,
  BUILTIN_RECEIPT_PRESETS,
  TransactionReceiptData,
} from "@/components/receipt/dynamic-receipt-renderer";



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
  cafeTables?: any[];
  appliedTheme?: any;
  tenantInfo?: {
    businessName?: string;
    logoUrl?: string | null;
    receiptConfig?: any;
  };
}

export function PosClient({
  initialShiftData,
  initialProducts,
  categories,
  cafeTables = [],
  appliedTheme,
  tenantInfo,
}: PosClientProps) {

  const [shiftData, setShiftData] = useState(initialShiftData);
  const [products, setProducts] = useState(initialProducts);

  // Dynamic Theming & Layout Engine from Context & DB
  const { themeTokens, posLayout: dynamicPosLayout } = useDynamicTheme();

  // Dynamic Tokens & Styles (Priority: Tenant's Active Applied Theme from Database)
  const dbTokens = (appliedTheme?.tokens as any) || {};
  const primaryColor = dbTokens.primaryColor || dbTokens.colors?.primary || themeTokens.colors.primary || "#4f46e5";
  const accentColor = dbTokens.accentColor || dbTokens.colors?.accent || themeTokens.colors.accent || "#06b6d4";
  const isDark = dbTokens.mode === "dark" || dbTokens.layoutStyle === "LUXE" || themeTokens.mode === "dark";
  const fontFamily = dbTokens.fontFamily || dbTokens.typography?.fontFamily || themeTokens.typography.fontFamily || "inherit";
  const radius = dbTokens.radius || dbTokens.effects?.borderRadius || themeTokens.effects.borderRadius || "1rem";

  const rawBg = dbTokens.colors?.background || dbTokens.bgStyle || themeTokens.colors.background;
  const bgStyle = isDark
    ? "radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 60%), " + (rawBg || "#090D16")
    : "radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.04) 0%, transparent 40%), " + (rawBg || "#F8FAFC");
  
  const cardBg = dbTokens.colors?.card || dbTokens.cardBg || themeTokens.colors.card || (isDark ? "#111a2e" : "#FFFFFF");
  const cardBorder = dbTokens.colors?.border || dbTokens.cardBorder || themeTokens.colors.border || (isDark ? "#1e293b" : "#e2e8f0");
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const innerBoxBg = dbTokens.colors?.backgroundMuted || dbTokens.innerBoxBg || themeTokens.colors.backgroundMuted || (isDark ? "#0f172a" : "#F8F9FD");
  const inputBg = cardBg;

  const headerBg = isDark
    ? "bg-[#0b1120]/95 border-slate-800/80 shadow-[0_4px_25px_rgba(0,0,0,0.5)] text-slate-100 backdrop-blur-md"
    : "bg-white/95 border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-slate-900 backdrop-blur-md";


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

  // POS Screen Layout Detection
  const posLayout: PosLayoutType =
    (tenantInfo?.receiptConfig?.posLayout as PosLayoutType) || "STANDARD";

  // 1. Cafe & Resto Workflow States
  const [selectedTable, setSelectedTable] = useState<string>("Meja 18");
  const [isDineIn, setIsDineIn] = useState<boolean>(true);
  const [modifierProduct, setModifierProduct] = useState<any | null>(null);
  const [drinkTemp, setDrinkTemp] = useState<"HOT" | "ICED">("ICED");
  const [drinkSweetness, setDrinkSweetness] = useState<string>("Normal Sweet");
  const [drinkIce, setDrinkIce] = useState<string>("Normal Ice");
  const [drinkMilk, setDrinkMilk] = useState<string>("Fresh Milk");
  const [drinkExtraShot, setDrinkExtraShot] = useState<boolean>(false);
  const [kitchenSlipSent, setKitchenSlipSent] = useState<boolean>(false);

  // 2. Barbershop Station Workflow States
  const [selectedChair, setSelectedChair] = useState<string>("Kursi 1");
  const [selectedCapster, setSelectedCapster] = useState<string>("Hendra");
  const capsterOptions = ["Hendra (Top Stylist)", "Budi (Senior)", "Anton (Junior)"];
  const [barberTip, setBarberTip] = useState<number>(0);

  // 3. Retail Fast-Barcode Workflow States
  const [showNumpad, setShowNumpad] = useState<boolean>(true);
  const [selectedCartIdx, setSelectedCartIdx] = useState<number | null>(null);

  // 4. Laundry Weighing Workflow States
  const [laundryWeight, setLaundryWeight] = useState<number>(3.5);
  const [laundryFragrance, setLaundryFragrance] = useState<string>("Lavender");
  const [laundryRack, setLaundryRack] = useState<string>("Rak B-04");

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

    // Jika layout Cafe dan produk minuman/kopi, buka pop-up kustomisasi rasa
    const isDrink =
      product.category?.toLowerCase().includes("minuman") ||
      product.category?.toLowerCase().includes("drink") ||
      product.category?.toLowerCase().includes("kopi") ||
      product.category?.toLowerCase().includes("coffee") ||
      product.category?.toLowerCase().includes("tea") ||
      product.name?.toLowerCase().includes("kopi") ||
      product.name?.toLowerCase().includes("latte") ||
      product.name?.toLowerCase().includes("tea") ||
      product.name?.toLowerCase().includes("espresso");

    if (posLayout === "CAFE_QUICK_ORDER" && isDrink) {
      setModifierProduct(product);
      return;
    }

    let defaultNote = "";
    if (posLayout === "BARBERSHOP_STATION") {
      defaultNote = `[${selectedChair} - ${selectedCapster}]`;
    } else if (posLayout === "LAUNDRY_WEIGHING") {
      defaultNote = `[${laundryWeight} Kg, ${laundryFragrance}, ${laundryRack}]`;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id && item.notes === defaultNote);
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
          item.productId === product.id && item.notes === defaultNote
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
            notes: defaultNote,
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
    <div
      className="flex flex-col h-screen overflow-hidden font-sans transition-all duration-300"
      style={{
        background: bgStyle,
        color: textPrimary,
        fontFamily,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root {
          --theme-primary: ${primaryColor};
          --theme-accent: ${accentColor};
          --theme-radius: ${radius};
          --theme-card-bg: ${cardBg};
          --theme-card-border: ${cardBorder};
          --theme-text-primary: ${textPrimary};
          --theme-text-secondary: ${textSecondary};
          --theme-inner-bg: ${innerBoxBg};
          --theme-input-bg: ${inputBg};
        }
      `,
        }}
      />

      {/* Top POS Navbar - Dynamic Theme Header */}
      <header
        className={`h-14 px-4 backdrop-blur-md border-b flex items-center justify-between flex-shrink-0 z-30 transition-all duration-300 ${headerBg}`}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs border"
            style={{
              backgroundColor: innerBoxBg,
              borderColor: cardBorder,
              color: textPrimary,
            }}
            title="Kembali ke Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-slate-400/20 hidden sm:block" />

          <div className="flex items-center gap-2">
            {tenantInfo?.logoUrl ? (
              <img
                src={tenantInfo.logoUrl}
                alt="Logo"
                className="w-7 h-7 rounded-xl object-cover border shadow-sm flex-shrink-0"
                style={{ borderColor: cardBorder }}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-xl text-white flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                POS
              </div>
            )}
            <div>
              <p className="text-xs font-black flex items-center gap-1.5" style={{ color: textPrimary }}>
                <span>{tenantInfo?.businessName || "POS"}</span>
                <span className="opacity-40">&bull;</span>
                <span>{shiftData.outlets.find((o) => o.id === shiftData.currentOutletId)?.name || "Outlet Utama"}</span>
                {activeShift ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Shift Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 border border-rose-500/30 text-[10px] font-bold">
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
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border"
                style={{
                  backgroundColor: innerBoxBg,
                  borderColor: cardBorder,
                  color: textPrimary,
                }}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Kas Masuk/Keluar</span>
              </button>

              <button
                onClick={() => setShowCloseShiftModal(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Tutup Shift</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition flex items-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <Clock className="w-4 h-4" />
              <span>Buka Shift Kasir</span>
            </button>
          )}
        </div>
      </header>

      {/* BODY CONTENT (POS CATALOG & CART) */}
      {!activeShift ? (
        /* Empty State: Shift Belum Dibuka */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div
            className="max-w-md w-full p-8 border shadow-lg space-y-5"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderRadius: radius,
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border shadow-sm"
              style={{
                backgroundColor: innerBoxBg,
                borderColor: cardBorder,
                color: primaryColor,
              }}
            >
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black" style={{ color: textPrimary }}>
                Shift Kasir Belum Dibuka
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: textSecondary }}>
                Untuk memulai melayani transaksi penjualan, mohon buka shift kasir terlebih dahulu dan masukkan modal kas awal.
              </p>
            </div>

            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="w-full py-3 rounded-xl font-black text-xs text-white shadow-md transition flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Clock className="w-4 h-4" />
              <span>Buka Shift Sekarang</span>
            </button>
          </div>
        </div>
      ) : (
        /* Main POS Active Interface - Dynamic Theme Layout */
        <div className={`flex-1 flex overflow-hidden ${dynamicPosLayout?.cartDock === "left" ? "flex-row-reverse" : "flex-row"}`}>
          {/* Left/Main Column: Product Catalog Grid */}
          <div
            className="flex-1 flex flex-col overflow-hidden border-r transition-all"
            style={{ borderColor: cardBorder }}
          >
            {/* SPECIALIZED VERTICAL CONTEXT SUB-HEADER */}
            {(appliedTheme?.vertical === "CAFE" ||
              dynamicPosLayout?.slots?.some((s: any) => s.widget === "pos.table_selector")) && (

              <div
                className="px-4 py-2.5 border-b flex items-center justify-between gap-3 text-xs font-bold"
                style={{
                  backgroundColor: innerBoxBg,
                  borderColor: cardBorder,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 opacity-70">
                    <Coffee className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    <span>Pilih Meja:</span>
                  </span>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border font-black text-xs cursor-pointer shadow-sm"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      color: textPrimary,
                    }}
                  >
                    {cafeTables && cafeTables.length > 0 ? (
                      cafeTables.map((tbl: any) => (
                        <option key={tbl.id} value={tbl.tableNumber}>
                          🪑 {tbl.tableNumber} {tbl.status === "OCCUPIED" ? "🔴 (Terisi)" : `🟢 (${tbl.capacity || 4} Kursi)`}
                        </option>
                      ))
                    ) : (
                      <option value="Meja 01">🪑 Meja 01</option>
                    )}
                  </select>


                  <div className="flex items-center gap-1 border p-0.5 rounded-lg" style={{ borderColor: cardBorder, backgroundColor: cardBg }}>
                    <button
                      type="button"
                      onClick={() => setIsDineIn(true)}
                      className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition ${
                        isDineIn ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500"
                      }`}
                    >
                      Dine In
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDineIn(false)}
                      className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition ${
                        !isDineIn ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500"
                      }`}
                    >
                      Take Away
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                    <ChefHat className="w-3 h-3" />
                    <span>Kitchen Mode On</span>
                  </span>
                </div>
              </div>
            )}

            {posLayout === "BARBERSHOP_STATION" && (
              <div
                className="px-4 py-2 border-b flex items-center justify-between gap-3 text-xs font-bold"
                style={{
                  backgroundColor: innerBoxBg,
                  borderColor: cardBorder,
                }}
              >
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="flex items-center gap-1 opacity-70 pr-1 flex-shrink-0">
                    <Scissors className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    <span>Station:</span>
                  </span>
                  {["Kursi 1", "Kursi 2", "Kursi 3", "Kursi 4"].map((chair) => (
                    <button
                      key={chair}
                      type="button"
                      onClick={() => setSelectedChair(chair)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition flex-shrink-0 ${
                        selectedChair === chair
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      💈 {chair}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] opacity-70">Capster:</span>
                  <select
                    value={selectedCapster}
                    onChange={(e) => setSelectedCapster(e.target.value)}
                    className="px-2 py-1 rounded-lg border font-bold text-xs cursor-pointer"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      color: textPrimary,
                    }}
                  >
                    {capsterOptions.map((c, idx) => (
                      <option key={idx} value={c.split(" ")[0]}>
                        👤 {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {posLayout === "RETAIL_FAST_BARCODE" && (
              <div
                className="px-4 py-2 border-b flex items-center justify-between gap-3 text-xs font-bold"
                style={{
                  backgroundColor: innerBoxBg,
                  borderColor: cardBorder,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 border border-blue-500/30 text-[10px] font-extrabold flex items-center gap-1">
                    <ScanBarcode className="w-3.5 h-3.5" />
                    <span>Auto-Scanner Active</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Arahkan barcode scanner ke produk untuk checkout cepat
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNumpad(!showNumpad)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
                    showNumpad ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600"
                  }`}
                >
                  <span>🔢 Numpad Kasir: {showNumpad ? "ON" : "OFF"}</span>
                </button>
              </div>
            )}

            {posLayout === "LAUNDRY_WEIGHING" && (
              <div
                className="px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-bold"
                style={{
                  backgroundColor: innerBoxBg,
                  borderColor: cardBorder,
                }}
              >
                {/* Weight Input Counter */}
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 opacity-70">
                    <Scale className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    <span>Timbangan (Kg):</span>
                  </span>
                  <div className="flex items-center gap-1 bg-white border p-0.5 rounded-xl shadow-sm">
                    <button
                      type="button"
                      onClick={() => setLaundryWeight(Math.max(0.5, Number((laundryWeight - 0.5).toFixed(1))))}
                      className="w-7 h-7 rounded-lg bg-slate-100 font-black text-sm flex items-center justify-center hover:bg-slate-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      value={laundryWeight}
                      onChange={(e) => setLaundryWeight(Number(e.target.value) || 1)}
                      className="w-14 text-center font-black text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setLaundryWeight(Number((laundryWeight + 0.5).toFixed(1)))}
                      className="w-7 h-7 rounded-lg bg-slate-100 font-black text-sm flex items-center justify-center hover:bg-slate-200"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[10px] font-black text-indigo-600">Kg</span>
                </div>

                {/* Fragrance & Rack */}
                <div className="flex items-center gap-2">
                  <select
                    value={laundryFragrance}
                    onChange={(e) => setLaundryFragrance(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border font-bold text-xs cursor-pointer"
                  >
                    <option value="Lavender">🌸 Lavender</option>
                    <option value="Sakura">🌺 Sakura</option>
                    <option value="Ocean Fresh">🌊 Ocean Fresh</option>
                    <option value="Vanilla">🍦 Vanilla</option>
                  </select>

                  <select
                    value={laundryRack}
                    onChange={(e) => setLaundryRack(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border font-black text-xs cursor-pointer"
                  >
                    <option value="Rak A-01">🧺 Rak A-01</option>
                    <option value="Rak A-02">🧺 Rak A-02</option>
                    <option value="Rak B-04">🧺 Rak B-04</option>
                    <option value="Rak C-08">🧺 Rak C-08</option>
                  </select>
                </div>
              </div>
            )}

            {/* Search & Category Filter Bar */}
            <div
              className="p-3.5 border-b flex flex-col gap-2.5 shadow-sm transition-all"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={
                    posLayout === "RETAIL_FAST_BARCODE"
                      ? "⚡ Scan Barcode SKU / Cari Nama Produk Kilat (Tekan Enter)"
                      : "Scan barcode SKU atau cari nama produk... (Tekan Enter untuk auto-add)"
                  }
                  className="w-full pl-10 pr-9 py-2.5 border rounded-xl text-xs placeholder-slate-400 focus:outline-none transition font-medium"
                  style={{
                    backgroundColor: inputBg,
                    borderColor: cardBorder,
                    color: textPrimary,
                    borderRadius: `calc(${radius} * 0.7)`,
                  }}
                />
                <ScanLine className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory("ALL")}
                  style={
                    selectedCategory === "ALL"
                      ? {
                          backgroundColor: primaryColor,
                          color: "#ffffff",
                          boxShadow: `0 2px 10px ${primaryColor}40`,
                        }
                      : {
                          backgroundColor: innerBoxBg,
                          borderColor: cardBorder,
                          color: textSecondary,
                        }
                  }
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition border"
                >
                  Semua
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={
                      selectedCategory === cat
                        ? {
                            backgroundColor: primaryColor,
                            color: "#ffffff",
                            boxShadow: `0 2px 10px ${primaryColor}40`,
                          }
                        : {
                            backgroundColor: innerBoxBg,
                            borderColor: cardBorder,
                            color: textSecondary,
                          }
                    }
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition border"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid - Dynamic Layout Density & Columns */}
            <div
              className={`flex-1 p-3.5 overflow-y-auto grid ${
                dynamicPosLayout?.productGridColumns === 3
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-3 gap-4"
                  : dynamicPosLayout?.productGridColumns === 6
                  ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2"
                  : isDark
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3.5"
                  : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3"
              } content-start`}
            >

              {filteredProducts.map((p) => {
                const inCart = cart.find((c) => c.productId === p.id);
                const isOutOfStock =
                  p.type === "BARANG" && (p.stockQty ?? 0) <= 0;

                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    style={{
                      backgroundColor: inCart ? (isDark ? `${primaryColor}25` : `${primaryColor}15`) : cardBg,
                      borderColor: inCart ? primaryColor : cardBorder,
                      borderRadius: radius,
                      boxShadow: inCart ? `0 0 15px ${primaryColor}30` : isDark ? "0 4px 15px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.02)",
                    }}

                    className={`p-3.5 border text-left flex flex-col justify-between transition relative overflow-hidden group ${
                      isOutOfStock ? "opacity-40 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    {inCart && (
                      <span
                        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full text-white text-[11px] font-black flex items-center justify-center shadow-md z-10"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {inCart.qty}
                      </span>
                    )}

                    {p.imageUrl && (
                      <div className="w-full h-24 mb-2.5 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex-shrink-0">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: textSecondary }}>
                        {p.category}
                      </span>
                      <h4 className="text-xs font-bold line-clamp-2 mt-0.5" style={{ color: textPrimary }}>
                        {p.name}
                      </h4>
                    </div>

                    <div
                      className="mt-3 pt-2 border-t flex items-center justify-between"
                      style={{ borderColor: cardBorder }}
                    >
                      <span className="text-xs font-black" style={{ color: primaryColor }}>
                        Rp {Number(p.price).toLocaleString("id-ID")}
                      </span>

                      {p.type === "BARANG" ? (
                        <span
                          className={`text-[10px] font-bold ${
                            (p.stockQty ?? 0) <= 5
                              ? "text-amber-500"
                              : "text-slate-400"
                          }`}
                        >
                          Stok {p.stockQty ?? 0}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-500">
                          Jasa
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Order Cart & Cash Checkout */}
          <div
            className="w-80 md:w-96 flex flex-col border-l flex-shrink-0 shadow-lg transition-all duration-300"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
            }}
          >
            {/* Cart Header */}
            <div
              className="p-3.5 border-b flex items-center justify-between"
              style={{ borderColor: cardBorder }}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" style={{ color: primaryColor }} />
                  <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: textPrimary }}>
                    Keranjang ({totalItemsCount})
                  </h3>
                </div>
                {/* Vertical Order Context Badge */}
                {posLayout === "CAFE_QUICK_ORDER" && (
                  <span className="text-[10px] font-bold text-indigo-600 block">
                    🪑 {selectedTable} • {isDineIn ? "Dine In" : "Take Away"}
                  </span>
                )}
                {posLayout === "BARBERSHOP_STATION" && (
                  <span className="text-[10px] font-bold text-amber-600 block">
                    💈 {selectedChair} • {selectedCapster}
                  </span>
                )}
                {posLayout === "LAUNDRY_WEIGHING" && (
                  <span className="text-[10px] font-bold text-cyan-600 block">
                    🧺 {laundryWeight} Kg • {laundryRack}
                  </span>
                )}
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-rose-500 hover:text-rose-600 font-bold"
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
                  <p className="text-xs font-bold" style={{ color: textPrimary }}>Keranjang masih kosong</p>
                  <p className="text-[11px] mt-0.5" style={{ color: textSecondary }}>
                    Klik produk di sebelah kiri atau scan barcode untuk menambahkan item.
                  </p>
                </div>
              ) : (
                cart.map((item, cIdx) => (
                  <div
                    key={item.productId}
                    onClick={() => setSelectedCartIdx(cIdx)}
                    className={`p-3 border flex items-center justify-between gap-2 transition cursor-pointer ${
                      selectedCartIdx === cIdx ? "ring-2 ring-indigo-500/50" : ""
                    }`}
                    style={{
                      backgroundColor: innerBoxBg,
                      borderColor: cardBorder,
                      borderRadius: `calc(${radius} * 0.7)`,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: textPrimary }}>
                        {item.name}
                      </p>
                      <p className="text-[11px] font-semibold" style={{ color: textSecondary }}>
                        Rp {item.price.toLocaleString("id-ID")} &times; {item.qty}
                      </p>
                      {item.notes && (
                        <p className="text-[9px] text-indigo-600 italic truncate mt-0.5">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => updateCartQty(item.productId, -1)}
                        className="w-6 h-6 rounded-lg border flex items-center justify-center font-bold"
                        style={{
                          backgroundColor: cardBg,
                          borderColor: cardBorder,
                          color: textPrimary,
                        }}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-black" style={{ color: textPrimary }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.productId, 1)}
                        className="w-6 h-6 rounded-lg border flex items-center justify-center font-bold"
                        style={{
                          backgroundColor: cardBg,
                          borderColor: cardBorder,
                          color: textPrimary,
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-slate-400 hover:text-rose-500 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Specialized Numpad for Retail Fast-Barcode */}
            {posLayout === "RETAIL_FAST_BARCODE" && showNumpad && (
              <div className="p-2 border-t bg-slate-50/80 dark:bg-slate-900/50 space-y-1">
                <div className="grid grid-cols-4 gap-1 text-xs font-black">
                  {[
                    "1", "2", "3", "+1",
                    "4", "5", "6", "+5",
                    "7", "8", "9", "C",
                    "0", "00", "Rp", "Pas",
                  ].map((btn) => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => {
                        if (btn === "C") {
                          setAmountPaid("");
                        } else if (btn === "Pas") {
                          setAmountPaid(totalAmount);
                        } else if (btn === "+1" && selectedCartIdx !== null && cart[selectedCartIdx]) {
                          updateCartQty(cart[selectedCartIdx].productId, 1);
                        } else if (btn === "+5" && selectedCartIdx !== null && cart[selectedCartIdx]) {
                          updateCartQty(cart[selectedCartIdx].productId, 5);
                        } else if (btn !== "+1" && btn !== "+5" && btn !== "Rp") {
                          setAmountPaid((prev) => `${prev}${btn}`);
                        }
                      }}
                      className="py-2 rounded-lg bg-white dark:bg-slate-800 border shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-95"
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cart Summary & Payment Keypad */}
            <div
              className="p-4 border-t space-y-3"
              style={{
                backgroundColor: innerBoxBg,
                borderColor: cardBorder,
              }}
            >
              {/* Specialized Kitchen Slip Button for Cafe */}
              {posLayout === "CAFE_QUICK_ORDER" && cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setKitchenSlipSent(true);
                    setTimeout(() => setKitchenSlipSent(false), 3000);
                  }}
                  className="w-full py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ChefHat className="w-4 h-4 text-amber-600" />
                  <span>
                    {kitchenSlipSent ? "✓ Tiket Terkirim ke Dapur!" : "Kirim Pesanan ke Dapur (KOT)"}
                  </span>
                </button>
              )}

              {/* Specialized Stylist Tip for Barbershop */}
              {posLayout === "BARBERSHOP_STATION" && cart.length > 0 && (
                <div className="flex items-center justify-between text-xs font-bold pt-1">
                  <span className="text-slate-500">Tip / Komisi Barber:</span>
                  <div className="flex items-center gap-1">
                    {[5000, 10000, 20000].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBarberTip(barberTip === t ? 0 : t)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                          barberTip === t ? "bg-amber-600 text-white" : "bg-white text-slate-600"
                        }`}
                      >
                        +{t / 1000}k
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-medium" style={{ color: textSecondary }}>
                  <span>Subtotal</span>
                  <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
                </div>
                {barberTip > 0 && (
                  <div className="flex items-center justify-between font-bold text-amber-600">
                    <span>Tip Stylist</span>
                    <span>+ Rp {barberTip.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div
                  className="flex items-center justify-between font-black text-sm pt-1.5 border-t"
                  style={{
                    borderColor: cardBorder,
                    color: textPrimary,
                  }}
                >
                  <span>Total Tagihan:</span>
                  <span className="text-lg font-black" style={{ color: primaryColor }}>
                    Rp {(totalAmount + barberTip).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Quick Cash Buttons */}
              {totalAmount > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => setAmountPaid(totalAmount + barberTip)}
                      className="py-1.5 rounded-xl border text-[11px] font-bold"
                      style={{
                        backgroundColor: `${primaryColor}20`,
                        color: primaryColor,
                        borderColor: primaryColor,
                      }}
                    >
                      Uang Pas
                    </button>
                    <button
                      onClick={() => setAmountPaid(50000)}
                      className="py-1.5 rounded-xl border text-[11px] font-semibold"
                      style={{
                        backgroundColor: cardBg,
                        borderColor: cardBorder,
                        color: textPrimary,
                      }}
                    >
                      Rp 50.000
                    </button>
                    <button
                      onClick={() => setAmountPaid(100000)}
                      className="py-1.5 rounded-xl border text-[11px] font-semibold"
                      style={{
                        backgroundColor: cardBg,
                        borderColor: cardBorder,
                        color: textPrimary,
                      }}
                    >
                      Rp 100.000
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: textSecondary }}>
                      Uang Tunai Diterima
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="Masukkan nominal bayar..."
                      className="w-full px-3 py-2.5 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                      style={{
                        backgroundColor: inputBg,
                        borderColor: cardBorder,
                        color: textPrimary,
                      }}
                    />
                  </div>

                  {parsedPaid >= (totalAmount + barberTip) && totalAmount > 0 && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs flex items-center justify-between font-bold">
                      <span>Kembalian:</span>
                      <span className="text-sm font-black">
                        Rp {Math.max(0, parsedPaid - (totalAmount + barberTip)).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={
                  cart.length === 0 ||
                  parsedPaid < (totalAmount + barberTip) ||
                  totalAmount <= 0 ||
                  loading
                }
                style={{
                  backgroundColor: primaryColor,
                  borderRadius: radius,
                  boxShadow: `0 6px 20px ${primaryColor}40`,
                }}
                className="w-full py-3.5 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
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

      {/* MODIFIERS MODAL FOR CAFE QUICK-ORDER */}
      {modifierProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border transition-all"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderRadius: radius,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cardBorder }}>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-indigo-600">Kustomisasi Minuman</span>
                <h3 className="font-black text-sm" style={{ color: textPrimary }}>{modifierProduct.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModifierProduct(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Temperature */}
              <div>
                <span className="font-bold block mb-1" style={{ color: textPrimary }}>Suhu:</span>
                <div className="grid grid-cols-2 gap-2">
                  {["ICED", "HOT"].map((temp) => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => setDrinkTemp(temp as any)}
                      className={`py-1.5 rounded-xl font-bold border transition ${
                        drinkTemp === temp ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-700"
                      }`}
                    >
                      {temp === "ICED" ? "❄️ Dingin (Iced)" : "☕ Panas (Hot)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sweetness */}
              <div>
                <span className="font-bold block mb-1" style={{ color: textPrimary }}>Tingkat Manis:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Normal Sweet", "Less Sugar", "No Sugar"].map((sweet) => (
                    <button
                      key={sweet}
                      type="button"
                      onClick={() => setDrinkSweetness(sweet)}
                      className={`py-1.5 rounded-lg text-[11px] font-bold border transition ${
                        drinkSweetness === sweet ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700"
                      }`}
                    >
                      {sweet}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ice Level */}
              {drinkTemp === "ICED" && (
                <div>
                  <span className="font-bold block mb-1" style={{ color: textPrimary }}>Level Es:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["Normal Ice", "Less Ice", "No Ice"].map((ice) => (
                      <button
                        key={ice}
                        type="button"
                        onClick={() => setDrinkIce(ice)}
                        className={`py-1.5 rounded-lg text-[11px] font-bold border transition ${
                          drinkIce === ice ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700"
                        }`}
                      >
                        {ice}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Milk Option */}
              <div>
                <span className="font-bold block mb-1" style={{ color: textPrimary }}>Pilihan Susu:</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "Fresh Milk", price: 0 },
                    { id: "Oat Milk (+5k)", price: 5000 },
                  ].map((milk) => (
                    <button
                      key={milk.id}
                      type="button"
                      onClick={() => setDrinkMilk(milk.id)}
                      className={`py-1.5 rounded-xl font-bold border text-[11px] transition ${
                        drinkMilk === milk.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700"
                      }`}
                    >
                      🥛 {milk.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex items-center gap-2" style={{ borderColor: cardBorder }}>
              <button
                type="button"
                onClick={() => setModifierProduct(null)}
                className="w-1/3 py-2.5 rounded-xl border text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const mods = `${drinkTemp === "ICED" ? "Iced" : "Hot"}, ${drinkSweetness}, ${drinkIce}, ${drinkMilk}`;
                  setCart((prev) => [
                    ...prev,
                    {
                      productId: modifierProduct.id,
                      name: modifierProduct.name,
                      price: Number(modifierProduct.price) + (drinkMilk.includes("Oat") ? 5000 : 0),
                      qty: 1,
                      notes: mods,
                    },
                  ]);
                  setModifierProduct(null);
                }}
                className="w-2/3 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition"
                style={{ backgroundColor: primaryColor }}
              >
                Tambahkan ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS (DYNAMIC THEMED SURFACES) ── */}

      {/* 1. Modal Buka Shift */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border transition-all"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              color: textPrimary,
              borderRadius: radius,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cardBorder }}>
              <h3 className="font-black text-sm flex items-center gap-2" style={{ color: textPrimary }}>
                <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                Buka Shift Kasir Baru
              </h3>
              <button
                onClick={() => setShowOpenShiftModal(false)}
                className="text-slate-400 hover:opacity-80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-bold mb-1" style={{ color: textSecondary }}>
                  Kas Modal Awal di Laci (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none"
                  style={{
                    backgroundColor: inputBg,
                    borderColor: cardBorder,
                    color: textPrimary,
                  }}
                />
                <p className="text-[10px] mt-1" style={{ color: textSecondary }}>
                  Uang pecahan kembalian awal di laci kasir.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenShiftModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold border transition"
                  style={{
                    backgroundColor: innerBoxBg,
                    borderColor: cardBorder,
                    color: textPrimary,
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-white font-extrabold shadow-md transition"
                  style={{ backgroundColor: primaryColor }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border transition-all"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              color: textPrimary,
              borderRadius: radius,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cardBorder }}>
              <h3 className="font-black text-sm flex items-center gap-2" style={{ color: textPrimary }}>
                <DollarSign className="w-4 h-4" style={{ color: primaryColor }} />
                Catat Mutasi Kas di Laci
              </h3>
              <button
                onClick={() => setShowCashMovementModal(false)}
                className="text-slate-400 hover:opacity-80"
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
                      : "border"
                  }`}
                  style={movementType !== "IN" ? { backgroundColor: innerBoxBg, borderColor: cardBorder, color: textSecondary } : undefined}
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
                      : "border"
                  }`}
                  style={movementType !== "OUT" ? { backgroundColor: innerBoxBg, borderColor: cardBorder, color: textSecondary } : undefined}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Kas Keluar (Out)
                </button>
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: textSecondary }}>
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="Contoh: 50000"
                  className="w-full px-3 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none"
                  style={{
                    backgroundColor: inputBg,
                    borderColor: cardBorder,
                    color: textPrimary,
                  }}
                />
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: textSecondary }}>
                  Keterangan / Alasan
                </label>
                <input
                  type="text"
                  required
                  value={movementNote}
                  onChange={(e) => setMovementNote(e.target.value)}
                  placeholder="Misal: Tambah modal koin, Beli es batu"
                  className="w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none"
                  style={{
                    backgroundColor: inputBg,
                    borderColor: cardBorder,
                    color: textPrimary,
                  }}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCashMovementModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold border transition"
                  style={{
                    backgroundColor: innerBoxBg,
                    borderColor: cardBorder,
                    color: textPrimary,
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-white font-extrabold shadow-md transition"
                  style={{ backgroundColor: primaryColor }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border transition-all"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              color: textPrimary,
              borderRadius: radius,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cardBorder }}>
              <h3 className="font-black text-sm flex items-center gap-2" style={{ color: textPrimary }}>
                <Lock className="w-4 h-4 text-rose-500" />
                Tutup Shift Kasir & Rekonsiliasi
              </h3>
              {!closeShiftSummary && (
                <button
                  onClick={() => setShowCloseShiftModal(false)}
                  className="text-slate-400 hover:opacity-80"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {closeShiftSummary ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 space-y-2">
                  <p className="font-black text-emerald-600 text-sm">
                    ✓ Shift Berhasil Ditutup!
                  </p>
                  <div className="space-y-1 pt-1 border-t border-emerald-500/30" style={{ color: textPrimary }}>
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
                      <span className="font-bold text-emerald-500">
                        +Rp {closeShiftSummary.totalCashIn?.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Kas Keluar:</span>
                      <span className="font-bold text-rose-500">
                        -Rp {closeShiftSummary.totalCashOut?.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-emerald-500/30 pt-1 font-bold">
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
                    <div className="flex justify-between font-black border-t border-emerald-500/30 pt-1">
                      <span>Selisih Kas:</span>
                      <span
                        className={
                          closeShiftSummary.difference === 0
                            ? "text-emerald-500"
                            : "text-rose-500"
                        }
                      >
                        Rp {closeShiftSummary.difference?.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={finishCloseShift}
                  className="w-full py-3 rounded-2xl text-white font-extrabold shadow-md transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  Selesai & Keluar Shift
                </button>
              </div>
            ) : (
              <form onSubmit={handleCloseShift} className="space-y-4 text-xs">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block font-bold mb-1" style={{ color: textSecondary }}>
                    Hitung Total Uang Fisik di Laci Kasir (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    placeholder="Hitung seluruh uang fisik di laci..."
                    className="w-full px-3 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none"
                    style={{
                      backgroundColor: inputBg,
                      borderColor: cardBorder,
                      color: textPrimary,
                    }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: textSecondary }}>
                    Sistem akan otomatis menghitung rekonsiliasi dan selisih kas.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCloseShiftModal(false)}
                    className="flex-1 py-2.5 rounded-xl font-bold border transition"
                    style={{
                      backgroundColor: innerBoxBg,
                      borderColor: cardBorder,
                      color: textPrimary,
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-extrabold shadow-md hover:bg-rose-700 transition"
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
      {showReceiptModal && completedTrx && (() => {
        const trx = completedTrx.transaction;
        const trxReceiptData: TransactionReceiptData = {
          storeName:
            tenantInfo?.businessName ||
            shiftData.outlets.find((o) => o.id === shiftData.currentOutletId)?.name ||
            "POS STORE",
          outletName:
            shiftData.outlets.find((o) => o.id === shiftData.currentOutletId)?.name ||
            "Outlet Utama",
          address:
            shiftData.outlets.find((o) => o.id === shiftData.currentOutletId)?.address ||
            "Alamat Outlet",
          logoUrl: tenantInfo?.logoUrl || null,
          invoiceNo: trx?.receiptNumber || `#INV-${Date.now()}`,
          dateTime: new Date(trx?.createdAt || Date.now()).toLocaleString("id-ID"),
          cashierName: shiftData.currentUser.name,
          queueNumber: trx?.queueNumber || `#${Math.floor(1000 + Math.random() * 9000)}`,
          tableNumber: selectedTable,
          orderType: isDineIn ? "Dine In" : "Take Away",
          items: (trx?.items || []).map((item: any) => ({
            name: item.productName || "Item",
            qty: item.quantity,
            price: Number(item.price),
            subtotal: Number(item.subtotal || item.quantity * item.price),
            notes: item.notes,
          })),
          subtotal: Number(trx?.totalAmount || 0),
          discountAmount: Number(trx?.discountAmount || 0),
          taxPb1Amount: Number(trx?.taxAmount || 0),
          grandTotal: Number(trx?.totalAmount || 0),
          paymentMethod: trx?.paymentMethod || "CASH",
          amountPaid: Number(trx?.amountPaid || trx?.totalAmount || 0),
          changeAmount: Number(trx?.change || 0),
          footerNote: "Terima kasih atas kunjungan Anda!",
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
            <div
              className="rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-3 border my-auto transition-all"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
                color: textPrimary,
                borderRadius: radius,
              }}
            >
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: cardBorder }}>
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 rounded text-[10px] font-bold">
                  ✓ Transaksi Kasir Berhasil
                </span>
                <span className="text-[10px] font-mono opacity-70">
                  {trxReceiptData.invoiceNo}
                </span>
              </div>

              {/* Dynamic Thermal Receipt Renderer */}
              <div className="max-h-[60vh] overflow-y-auto rounded-xl p-1 bg-stone-100/50 border border-stone-200">
                <DynamicReceiptRenderer data={trxReceiptData} />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: cardBorder }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 border"
                  style={{
                    backgroundColor: innerBoxBg,
                    borderColor: cardBorder,
                    color: textPrimary,
                  }}
                >
                  <Printer className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  <span>Cetak Struk</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiptModal(false);
                    setCompletedTrx(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-white font-extrabold shadow-md transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

