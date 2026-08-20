"use client";

import { useState, useEffect, useRef } from "react";
import { swalWarning, toastError } from "@/lib/swal";
import Link from "next/link";
import {
  openShiftAction,
  closeShiftAction,
  addCashMovementAction,
  getLiveShiftSummaryAction,
} from "@/modules/transaction/shift-actions";
import {
  createTransactionAction,
  verifyVoucherAction,
  CartItemInput,
  DiscountType,
  VoucherValidationResult,
} from "@/modules/transaction/actions";
import {
  searchCustomerQuickAction,
  createCustomerAction,
} from "@/modules/customer/actions";
import {
  getLiveOrdersAction,
  updateLiveOrderStatusAction,
  checkoutLiveOrderAction,
  LiveOrderSummary,
} from "@/modules/self-order/actions";
import { LanguageSwitcher } from "@/lib/i18n/language-switcher";
import { useTranslation } from "@/lib/i18n/language-context";
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
  Tag,
  Ticket,
  Percent,
  UserCheck,
  UserPlus,
  Phone,
  MapPin,
  FileText,
  Smartphone,
  Send,
  QrCode,
  RefreshCw,
  Receipt,
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
  staffList?: any[];
  appliedTheme?: any;
  hasSelfOrderPlugin?: boolean;
  tenantInfo?: {
    tenantId?: string;
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
  staffList = [],
  appliedTheme,
  hasSelfOrderPlugin = false,
  tenantInfo,
}: PosClientProps) {
  const { locale, tr, t } = useTranslation();
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
  const [showShiftSummaryModal, setShowShiftSummaryModal] = useState(false);
  const [liveShiftSummary, setLiveShiftSummary] = useState<any | null>(null);
  const [loadingShiftSummary, setLoadingShiftSummary] = useState(false);
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

  // Discount & Voucher Promo States
  const [showDiscountDrawer, setShowDiscountDrawer] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENT");
  const [discountPercent, setDiscountPercent] = useState<number | string>("");
  const [discountFixed, setDiscountFixed] = useState<number | string>("");
  const [voucherCodeInput, setVoucherCodeInput] = useState<string>("");
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherValidationResult | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // Customer CRM States (Fase 4)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    notes: "",
    address: "",
  });
  const [newCustomerLoading, setNewCustomerLoading] = useState(false);
  const [newCustomerError, setNewCustomerError] = useState<string | null>(null);

  // Live Order & QR Self-Order States (Fase 5)
  const [posCartTab, setPosCartTab] = useState<"MANUAL" | "LIVE_ORDERS">("MANUAL");
  const [liveOrders, setLiveOrders] = useState<LiveOrderSummary[]>([]);
  const [liveOrdersLoading, setLiveOrdersLoading] = useState(false);
  const [selectedLiveOrderForPay, setSelectedLiveOrderForPay] = useState<LiveOrderSummary | null>(null);
  const [liveOrderPaidInput, setLiveOrderPaidInput] = useState<number | string>("");
  const [liveOrderPaymentMethod, setLiveOrderPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [processingLiveOrder, setProcessingLiveOrder] = useState(false);

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
  const barbersList = staffList.filter((s: any) => s.position === "BARBER" || s.role === "KASIR" || s.position === "KASIR");
  const [selectedChair, setSelectedChair] = useState<string>("Kursi 1");
  const [selectedCapsterId, setSelectedCapsterId] = useState<string>(barbersList[0]?.id || staffList[0]?.id || "");
  const [selectedCapster, setSelectedCapster] = useState<string>(barbersList[0]?.name || "Stylist");
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

  // Hitung subtotal belanja produk (sebelum diskon & tip)
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  // Hitung nominal potongan diskon yang aktif
  let discountAmount = 0;
  if (discountType === "PERCENT" && Number(discountPercent) > 0) {
    discountAmount = Math.round((cartSubtotal * Number(discountPercent)) / 100);
  } else if (discountType === "FIXED" && Number(discountFixed) > 0) {
    discountAmount = Number(discountFixed);
  } else if (discountType === "VOUCHER" && appliedVoucher) {
    discountAmount = appliedVoucher.discountAmount;
  }
  discountAmount = Math.min(cartSubtotal, Math.max(0, discountAmount));

  // Grand Total Belanja
  const totalAmount = Math.max(0, cartSubtotal - discountAmount);
  const grandTotalWithTip = totalAmount + barberTip;

  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const parsedPaid = Number(amountPaid) || 0;
  const change = Math.max(0, parsedPaid - grandTotalWithTip);

  // Handle Verifikasi & Terapkan Voucher
  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) return;
    if (cartSubtotal <= 0) {
      setVoucherError("Tambahkan item ke keranjang terlebih dahulu.");
      return;
    }
    setVoucherLoading(true);
    setVoucherError(null);
    try {
      const result = await verifyVoucherAction(voucherCodeInput, cartSubtotal);
      setAppliedVoucher(result);
      setDiscountType("VOUCHER");
      setSuccessMsg(`Voucher "${result.code}" berhasil diterapkan: Potongan Rp ${result.discountAmount.toLocaleString("id-ID")}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setVoucherError(err.message || "Kode voucher tidak valid.");
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleResetDiscount = () => {
    setDiscountPercent("");
    setDiscountFixed("");
    setVoucherCodeInput("");
    setAppliedVoucher(null);
    setVoucherError(null);
  };

  // Customer Quick Search & Add Handlers (Fase 4)
  const handleSearchCustomer = async (q: string) => {
    setCustomerSearchQuery(q);
    if (!q || q.trim().length < 1) {
      setCustomerSearchResults([]);
      return;
    }
    setCustomerSearchLoading(true);
    try {
      const results = await searchCustomerQuickAction(q);
      setCustomerSearchResults(results);
    } catch (err) {
      console.error("Gagal mencari pelanggan:", err);
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const handleSelectCustomer = (cust: any) => {
    setSelectedCustomer(cust);
    setShowCustomerModal(false);
    setCustomerSearchQuery("");
    setCustomerSearchResults([]);
    setSuccessMsg(`Pelanggan "${cust.name}" terpilih untuk transaksi ini.`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleCreateCustomerFromPos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) return;
    setNewCustomerLoading(true);
    setNewCustomerError(null);
    try {
      const res = await createCustomerAction(newCustomerForm);
      if (res.success && res.customer) {
        setSelectedCustomer(res.customer);
        setShowCustomerModal(false);
        setIsCreatingCustomer(false);
        setNewCustomerForm({ name: "", phone: "", notes: "", address: "" });
        setSuccessMsg(`Pelanggan baru "${res.customer.name}" berhasil didaftarkan & dipilih!`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setNewCustomerError(err.message || "Gagal menambahkan pelanggan.");
    } finally {
      setNewCustomerLoading(false);
    }
  };

  // Live Order Action Handlers (Fase 5)
  const loadLiveOrders = async () => {
    if (!hasSelfOrderPlugin) return;
    setLiveOrdersLoading(true);
    try {
      const res = await getLiveOrdersAction({ outletId: shiftData.currentOutletId });
      setLiveOrders(res);
    } catch (err) {
      console.error("Gagal memuat live orders:", err);
    } finally {
      setLiveOrdersLoading(false);
    }
  };

  // Auto-polling live orders setiap 15 detik jika plugin aktif
  useEffect(() => {
    if (!hasSelfOrderPlugin) return;
    loadLiveOrders();
    const interval = setInterval(() => {
      loadLiveOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, [hasSelfOrderPlugin, shiftData.currentOutletId]);

  const handleUpdateLiveOrderStatus = async (
    orderId: string,
    status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED"
  ) => {
    try {
      await updateLiveOrderStatusAction(orderId, status);
      setLiveOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      setSuccessMsg(`Status pesanan berhasil diubah menjadi ${status}.`);
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      toastError(err.message || "Gagal mengubah status pesanan.");
    }
  };

  const handleOpenLiveOrderPayment = (order: LiveOrderSummary) => {
    setSelectedLiveOrderForPay(order);
    setLiveOrderPaidInput(order.totalAmount);
    setLiveOrderPaymentMethod("CASH");
  };

  const handleConfirmLiveOrderPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLiveOrderForPay || !activeShift) {
      toastError("Harap buka shift kasir terlebih dahulu.");
      return;
    }

    const paidNum = Number(liveOrderPaidInput) || 0;
    if (paidNum < selectedLiveOrderForPay.totalAmount) {
      toastError(`Uang bayar kurang dari total tagihan (Rp ${selectedLiveOrderForPay.totalAmount.toLocaleString("id-ID")}).`);
      return;
    }

    setProcessingLiveOrder(true);
    try {
      const res = await checkoutLiveOrderAction({
        orderId: selectedLiveOrderForPay.id,
        shiftId: activeShift.id,
        paymentMethod: liveOrderPaymentMethod,
        amountPaid: paidNum,
      });

      if (res.success) {
        setSelectedLiveOrderForPay(null);
        setSuccessMsg(`Pesanan ${selectedLiveOrderForPay.orderNumber} berhasil dilunasi & dicatat ke shift kasir!`);
        setTimeout(() => setSuccessMsg(null), 3000);
        loadLiveOrders();
      }
    } catch (err: any) {
      toastError(err.message || "Gagal memproses pembayaran live order.");
    } finally {
      setProcessingLiveOrder(false);
    }
  };

  // Tambah item ke keranjang
  const addToCart = async (product: any) => {
    if (!activeShift) {
      await swalWarning(
        "Shift Belum Dibuka",
        "Silakan buka shift kasir terlebih dahulu untuk mulai melayani transaksi."
      );
      setShowOpenShiftModal(true);
      return;
    }

    if (product.type === "BARANG" && (product.stockQty ?? 0) <= 0) {
      await swalWarning("Stok Habis", "Stok barang ini sudah habis.");
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

    // Tentukan staf penanggung jawab otomatis
    let staffIdToAssign: string | undefined = undefined;
    if (posLayout === "BARBERSHOP_STATION" || product.type === "JASA") {
      staffIdToAssign = selectedCapsterId || (barbersList[0]?.id || staffList[0]?.id);
    }

    const existing = cart.find((item) => item.productId === product.id && item.notes === defaultNote);
    if (
      existing &&
      product.type === "BARANG" &&
      product.stockQty !== null &&
      existing.qty >= product.stockQty
    ) {
      await swalWarning("Stok Tidak Cukup", `Maksimal stok tersedia hanya ${product.stockQty}`);
      return;
    }

    setCart((prev) => {
      const existingInPrev = prev.find((item) => item.productId === product.id && item.notes === defaultNote);
      if (existingInPrev) {
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
            staffId: staffIdToAssign,
          },
        ];
      }
    });
  };

  const updateCartQty = async (productId: string, delta: number) => {
    const existing = cart.find((item) => item.productId === productId);
    if (existing && delta > 0) {
      const product = products.find((p) => p.id === productId);
      if (
        product &&
        product.type === "BARANG" &&
        product.stockQty !== null &&
        existing.qty + delta > product.stockQty
      ) {
        await swalWarning("Stok Tidak Cukup", `Maksimal stok hanya ${product.stockQty}`);
        return;
      }
    }

    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItemInput[];
    });
  };

  const updateItemStaff = (productId: string, staffId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, staffId: staffId || undefined } : item
      )
    );
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
      await swalWarning("Shift Belum Dibuka", "Harap buka shift kasir terlebih dahulu.");
      return;
    }
    if (cart.length === 0) {
      await swalWarning("Keranjang Kosong", "Keranjang belanja masih kosong.");
      return;
    }
    if (parsedPaid < grandTotalWithTip) {
      await swalWarning("Pembayaran Kurang", "Uang pembayaran kurang dari total tagihan.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const selectedTblObj = cafeTables.find((t: any) => t.tableNumber === selectedTable || t.id === selectedTable);

      const res = await createTransactionAction({
        shiftId: activeShift.id,
        outletId: shiftData.currentOutletId,
        customerId: selectedCustomer?.id || null,
        items: cart,
        paymentMethod: "CASH",
        amountPaid: parsedPaid,
        discountType: discountAmount > 0 ? discountType : null,
        discountValue:
          discountType === "PERCENT"
            ? Number(discountPercent)
            : discountType === "FIXED"
            ? Number(discountFixed)
            : appliedVoucher?.discountValue || 0,
        discountAmount,
        voucherCode: discountType === "VOUCHER" && appliedVoucher ? appliedVoucher.code : null,
        tableId: isDineIn && selectedTblObj ? selectedTblObj.id : null,
        orderType: isDineIn ? "DINE_IN" : "TAKEAWAY",
        laundryDetails:
          posLayout === "LAUNDRY_WEIGHING"
            ? {
                customerName: selectedCustomer?.name,
                customerPhone: selectedCustomer?.phone || undefined,
                weightKg: Number(laundryWeight) || undefined,
                fragrance: laundryFragrance,
                rackNumber: laundryRack,
              }
            : undefined,
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

  // Handle Buka Modal Rekap Kas Shift Live
  const openLiveShiftSummary = async () => {
    if (!activeShift) return;
    setLoadingShiftSummary(true);
    setShowShiftSummaryModal(true);
    try {
      const summary = await getLiveShiftSummaryAction(activeShift.id);
      setLiveShiftSummary(summary);
    } catch (err: any) {
      toastError(err.message || "Gagal memuat rekap kas shift.");
    } finally {
      setLoadingShiftSummary(false);
    }
  };

  const openCloseShiftModal = async () => {
    if (!activeShift) return;
    setLoadingShiftSummary(true);
    setShowCloseShiftModal(true);
    try {
      const summary = await getLiveShiftSummaryAction(activeShift.id);
      setLiveShiftSummary(summary);
    } catch (err: any) {
      // ignore
    } finally {
      setLoadingShiftSummary(false);
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
    setLiveShiftSummary(null);
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
                onClick={openLiveShiftSummary}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-xs"
                style={{
                  backgroundColor: innerBoxBg,
                  borderColor: cardBorder,
                  color: textPrimary,
                }}
                title="Lihat Laporan Rekapitulasi Kas & Omzet Shift Berjalan"
              >
                <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Rekap Kas Shift</span>
              </button>

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
                onClick={openCloseShiftModal}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
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
                      {tr("Makan di Tempat")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDineIn(false)}
                      className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition ${
                        !isDineIn ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500"
                      }`}
                    >
                      {tr("Bawa Pulang")}
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
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] opacity-70">Stylist:</span>
                  <select
                    value={selectedCapsterId}
                    onChange={(e) => {
                      setSelectedCapsterId(e.target.value);
                      const found = staffList.find((s: any) => s.id === e.target.value);
                      if (found) setSelectedCapster(found.name);
                    }}
                    className="px-2.5 py-1 rounded-lg border font-bold text-xs cursor-pointer"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      color: textPrimary,
                    }}
                  >
                    {barbersList.length > 0 ? (
                      barbersList.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          👤 {c.name} ({c.position || "Stylist"})
                        </option>
                      ))
                    ) : (
                      <option value="">👤 Semua Stylist</option>
                    )}
                  </select>
                </div>            </div>
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
                        (p.stockQty ?? 0) <= 0 ? (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                            Habis (0)
                          </span>
                        ) : (p.stockQty ?? 0) <= (p.minStockAlert ?? 5) ? (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            ⚠️ Stok {p.stockQty}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">
                            Stok {p.stockQty ?? 0}
                          </span>
                        )
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

          {/* Right Column: Order Cart & Cash Checkout / Live Order Feed */}
          <div
            className="w-80 md:w-96 flex flex-col border-l flex-shrink-0 shadow-lg transition-all duration-300"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
            }}
          >
            {/* DYNAMIC POS SWITCHER TAB (Hanya muncul jika plugin self_order aktif) */}
            {hasSelfOrderPlugin && (
              <div
                className="p-2 border-b flex gap-1 flex-shrink-0"
                style={{ borderColor: cardBorder, backgroundColor: innerBoxBg }}
              >
                <button
                  type="button"
                  onClick={() => setPosCartTab("MANUAL")}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    posCartTab === "MANUAL"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Kasir Manual</span>
                  {cart.length > 0 && (
                    <span className={`text-[10px] px-1.5 rounded-full font-black ${posCartTab === "MANUAL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                      {cart.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPosCartTab("LIVE_ORDERS");
                    loadLiveOrders();
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 relative cursor-pointer ${
                    posCartTab === "LIVE_ORDERS"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>
                    {posLayout === "CAFE_QUICK_ORDER"
                      ? "Pesanan Meja"
                      : posLayout === "BARBERSHOP_STATION"
                      ? "Antrean Tamu"
                      : posLayout === "LAUNDRY_WEIGHING"
                      ? "Drop-Off"
                      : "Live Order"}
                  </span>
                  {liveOrders.filter((o) => o.status === "PENDING").length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  )}
                  <span
                    className={`text-[10px] px-1.5 rounded-full font-black ${
                      posCartTab === "LIVE_ORDERS" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {liveOrders.length}
                  </span>
                </button>
              </div>
            )}

            {/* TAB VIEW 1: LIVE ORDERS FEED (Fase 5) */}
            {posCartTab === "LIVE_ORDERS" ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Live Order Header */}
                <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: cardBorder }}>
                  <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: textPrimary }}>
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                    <span>Live Incoming Orders ({liveOrders.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={loadLiveOrders}
                    disabled={liveOrdersLoading}
                    className="p-1.5 rounded-lg border text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition cursor-pointer"
                    style={{ borderColor: cardBorder }}
                    title="Refresh pesanan live"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${liveOrdersLoading ? "animate-spin text-indigo-600" : ""}`} />
                  </button>
                </div>

                {/* Orders List Container */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {liveOrders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                      <QrCode className="w-10 h-10 opacity-30 text-indigo-500" />
                      <p className="text-xs font-bold" style={{ color: textPrimary }}>Belum Ada Pesanan Masuk</p>
                      <p className="text-[11px] max-w-[200px]" style={{ color: textSecondary }}>
                        Pelanggan dapat melakukan scan QR di meja/lokasi untuk memesan mandiri.
                      </p>
                    </div>
                  ) : (
                    liveOrders.map((order) => {
                      const isOnlinePaid = order.paymentStatus === "PAID_ONLINE";

                      return (
                        <div
                          key={order.id}
                          className="p-3.5 rounded-2xl border space-y-2.5 shadow-sm transition hover:shadow-md animate-in fade-in"
                          style={{
                            backgroundColor: innerBoxBg,
                            borderColor: order.status === "PENDING" ? "#6366f1" : cardBorder,
                          }}
                        >
                          {/* Card Header per Vertical Adapter */}
                          <div className="flex items-start justify-between gap-2 border-b pb-2" style={{ borderColor: cardBorder }}>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-xs text-indigo-600">
                                  {order.verticalType === "CAFE" && `🪑 ${order.tableNumber || "Meja"}`}
                                  {order.verticalType === "BARBERSHOP" && `💈 Antrean #${order.queueNumber || "A-01"}`}
                                  {order.verticalType === "LAUNDRY" && `🧺 ${order.serviceType || "KILOAN"} (${order.fragrance || "Parfum"})`}
                                  {order.verticalType === "RETAIL" && `🛍️ Pickup ${order.orderNumber.slice(-4)}`}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                    order.status === "PENDING"
                                      ? "bg-rose-100 text-rose-800 animate-pulse"
                                      : order.status === "PREPARING"
                                      ? "bg-amber-100 text-amber-800"
                                      : order.status === "READY"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>
                              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                {order.customerName} {order.customerPhone && <span className="text-slate-400 font-normal">({order.customerPhone})</span>}
                              </div>
                            </div>

                            {/* Payment Status Badge */}
                            <div className="text-right">
                              {isOnlinePaid ? (
                                <span className="inline-flex items-center gap-0.5 text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-2.5 h-2.5" /> SUDAH LUNAS (QRIS)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  <DollarSign className="w-2.5 h-2.5" /> Bayar di Kasir
                                </span>
                              )}
                              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                {new Date(order.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="space-y-1 text-xs">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[11px]">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {item.qty}x {item.name}
                                  {item.notes && <span className="italic text-indigo-500 text-[10px] ml-1">({item.notes})</span>}
                                </span>
                                <span className="font-mono text-slate-500">
                                  Rp {(item.price * item.qty).toLocaleString("id-ID")}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Customer Notes */}
                          {order.customerNotes && (
                            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-800 dark:text-amber-300 flex items-start gap-1">
                              <FileText className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                              <span><strong>Catatan Tamu:</strong> {order.customerNotes}</span>
                            </div>
                          )}

                          {/* Total Tagihan */}
                          <div className="flex justify-between items-center pt-1 border-t text-xs font-black" style={{ borderColor: cardBorder }}>
                            <span style={{ color: textSecondary }}>Total:</span>
                            <span className="text-sm font-black text-indigo-600">
                              Rp {order.totalAmount.toLocaleString("id-ID")}
                            </span>
                          </div>

                          {/* Action Buttons per Vertical */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            {/* Tombol Cetak Struk Dapur / Slip */}
                            <button
                              type="button"
                              onClick={() => {
                                setSuccessMsg(`Tiket dapur untuk ${order.tableNumber || order.orderNumber} dicetak.`);
                                setTimeout(() => setSuccessMsg(null), 2500);
                              }}
                              className="py-1.5 px-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                              style={{ borderColor: cardBorder, color: textPrimary }}
                            >
                              <Printer className="w-3 h-3 text-slate-500" />
                              <span>Struk Dapur</span>
                            </button>

                            {/* Tombol Aksi Kasir Utama */}
                            {isOnlinePaid ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateLiveOrderStatus(order.id, "COMPLETED")}
                                className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center justify-center gap-1 shadow-sm transition"
                              >
                                <Check className="w-3 h-3" />
                                <span>Selesaikan Meja</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenLiveOrderPayment(order)}
                                className="py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black flex items-center justify-center gap-1 shadow-sm transition"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>Terima Bayar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* TAB VIEW 2: MANUAL POS CART */
              <>
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
                      className="text-[11px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>

                {/* Customer CRM Bar (Fase 4) */}
                <div
                  className="px-3.5 py-2 border-b flex items-center justify-between gap-2"
                  style={{
                    borderColor: cardBorder,
                    backgroundColor: innerBoxBg,
                  }}
                >
                  {selectedCustomer ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {selectedCustomer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate flex items-center gap-1" style={{ color: textPrimary }}>
                            <span>{selectedCustomer.name}</span>
                            {selectedCustomer.notes && (
                              <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-normal truncate max-w-[90px]" title={selectedCustomer.notes}>
                                {selectedCustomer.notes}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                            {selectedCustomer.phone && <span>{selectedCustomer.phone}</span>}
                            <span className="text-indigo-600 font-bold">• {selectedCustomer.visits || 0}x hadir</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCustomer(null)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Ganti / Lepas Pelanggan"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowCustomerModal(true);
                        setIsCreatingCustomer(false);
                      }}
                      className="w-full py-1.5 px-2.5 rounded-xl border border-dashed text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/40 active:scale-98 cursor-pointer"
                      style={{ borderColor: cardBorder }}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>+ Pilih / Tambah Pelanggan (CRM)</span>
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
                          {/* Staff Assignment per Item */}
                          {staffList && staffList.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1.5" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[9px] text-slate-400 font-semibold">Petugas:</span>
                              <select
                                value={item.staffId || ""}
                                onChange={(e) => updateItemStaff(item.productId, e.target.value)}
                                className="px-2 py-0.5 rounded-lg border text-[9.5px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none"
                                style={{ borderColor: cardBorder }}
                              >
                                <option value="">-- Tanpa Komisi (Opsional) --</option>
                                {staffList.map((st: any) => (
                                  <option key={st.id} value={st.id}>
                                    {st.name} ({st.position || "Staff"})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => updateCartQty(item.productId, -1)}
                            className="w-6 h-6 rounded-lg border flex items-center justify-center font-bold cursor-pointer"
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
                            className="w-6 h-6 rounded-lg border flex items-center justify-center font-bold cursor-pointer"
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
                            className="p-1 text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
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
                          className="py-2 rounded-lg bg-white dark:bg-slate-800 border shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-95 cursor-pointer"
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
                      className="w-full py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
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
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                              barberTip === t ? "bg-amber-600 text-white" : "bg-white text-slate-600"
                            }`}
                          >
                            +{t / 1000}k
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DISKON & VOUCHER PROMO SECTION */}
                  <div
                    className="p-3 rounded-2xl border transition-all space-y-2.5"
                    style={{
                      backgroundColor: innerBoxBg,
                      borderColor: cardBorder,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowDiscountDrawer((prev) => !prev)}
                        className="flex items-center gap-1.5 text-xs font-bold transition hover:opacity-80 cursor-pointer"
                        style={{ color: primaryColor }}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>{discountAmount > 0 ? "Promo Diterapkan" : "+ Diskon / Voucher Promo"}</span>
                      </button>

                      {discountAmount > 0 && (
                        <button
                          type="button"
                          onClick={handleResetDiscount}
                          className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" /> Hapus Diskon
                        </button>
                      )}
                    </div>

                    {/* Discount Applied Badge */}
                    {discountAmount > 0 && !showDiscountDrawer && (
                      <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs font-bold text-emerald-600">
                        <span className="flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5" />
                          {discountType === "PERCENT"
                            ? `Diskon ${discountPercent}%`
                            : discountType === "FIXED"
                            ? `Potongan Manual`
                            : `Voucher: ${appliedVoucher?.code}`}
                        </span>
                        <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                      </div>
                    )}

                    {/* Expanded Discount Controls */}
                    {showDiscountDrawer && (
                      <div className="space-y-3 pt-2 border-t" style={{ borderColor: cardBorder }}>
                        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              setDiscountType("PERCENT");
                              setAppliedVoucher(null);
                            }}
                            className={`py-1 rounded-lg transition flex items-center justify-center gap-1 ${
                              discountType === "PERCENT"
                                ? "bg-white dark:bg-slate-900 shadow-sm text-indigo-600 font-black"
                                : "opacity-70 hover:opacity-100"
                            }`}
                          >
                            <Percent className="w-3 h-3" />
                            <span>Persen</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDiscountType("FIXED");
                              setAppliedVoucher(null);
                            }}
                            className={`py-1 rounded-lg transition flex items-center justify-center gap-1 ${
                              discountType === "FIXED"
                                ? "bg-white dark:bg-slate-900 shadow-sm text-indigo-600 font-black"
                                : "opacity-70 hover:opacity-100"
                            }`}
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Nominal</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDiscountType("VOUCHER");
                              setDiscountPercent("");
                              setDiscountFixed("");
                            }}
                            className={`py-1 rounded-lg transition flex items-center justify-center gap-1 ${
                              discountType === "VOUCHER"
                                ? "bg-white dark:bg-slate-900 shadow-sm text-indigo-600 font-black"
                                : "opacity-70 hover:opacity-100"
                            }`}
                          >
                            <Ticket className="w-3 h-3" />
                            <span>Voucher</span>
                          </button>
                        </div>

                        {discountType === "PERCENT" && (
                          <div className="space-y-2">
                            <div className="flex gap-1">
                              {[5, 10, 15, 20, 50].map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => {
                                    setDiscountPercent(p);
                                    setDiscountFixed("");
                                  }}
                                  className={`flex-1 py-1 rounded-lg text-xs font-bold border transition ${
                                    Number(discountPercent) === p
                                      ? "bg-indigo-600 text-white border-indigo-600"
                                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                  }`}
                                  style={{ borderColor: cardBorder }}
                                >
                                  {p}%
                                </button>
                              ))}
                            </div>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={discountPercent}
                              onChange={(e) => {
                                setDiscountPercent(e.target.value);
                                setDiscountFixed("");
                              }}
                              placeholder="Atau ketik persen diskon..."
                              className="w-full px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none"
                              style={{
                                backgroundColor: inputBg,
                                borderColor: cardBorder,
                                color: textPrimary,
                              }}
                            />
                          </div>
                        )}

                        {discountType === "FIXED" && (
                          <div className="space-y-2">
                            <div className="flex gap-1">
                              {[5000, 10000, 20000, 50000].map((f) => (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => {
                                    setDiscountFixed(f);
                                    setDiscountPercent("");
                                  }}
                                  className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition ${
                                    Number(discountFixed) === f
                                      ? "bg-indigo-600 text-white border-indigo-600"
                                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                  }`}
                                  style={{ borderColor: cardBorder }}
                                >
                                  {f / 1000}k
                                </button>
                              ))}
                            </div>
                            <input
                              type="number"
                              min={0}
                              value={discountFixed}
                              onChange={(e) => {
                                setDiscountFixed(e.target.value);
                                setDiscountPercent("");
                              }}
                              placeholder="Nominal potongan (Rp)..."
                              className="w-full px-3 py-1.5 rounded-xl border text-xs font-mono font-bold focus:outline-none"
                              style={{
                                backgroundColor: inputBg,
                                borderColor: cardBorder,
                                color: textPrimary,
                              }}
                            />
                          </div>
                        )}

                        {discountType === "VOUCHER" && (
                          <div className="space-y-2">
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={voucherCodeInput}
                                onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === "Enter" && handleApplyVoucher()}
                                placeholder="KODE VOUCHER (HEMAT10, PROMO20)"
                                className="flex-1 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold uppercase focus:outline-none"
                                style={{
                                  backgroundColor: inputBg,
                                  borderColor: cardBorder,
                                  color: textPrimary,
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleApplyVoucher}
                                disabled={voucherLoading || !voucherCodeInput.trim()}
                                className="px-3 py-1.5 rounded-xl text-white font-extrabold text-xs shadow transition disabled:opacity-50 cursor-pointer"
                                style={{ backgroundColor: primaryColor }}
                              >
                                {voucherLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Gunakan"}
                              </button>
                            </div>
                            {voucherError && (
                              <p className="text-[11px] text-rose-500 font-bold">⚠️ {voucherError}</p>
                            )}
                            {appliedVoucher && (
                              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-600 flex items-center justify-between">
                                <span>✓ {appliedVoucher.description}</span>
                                <span>- Rp {appliedVoucher.discountAmount.toLocaleString("id-ID")}</span>
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 flex flex-wrap gap-1">
                              <span>Voucher aktif:</span>
                              <span className="font-mono font-bold text-indigo-500 cursor-pointer" onClick={() => setVoucherCodeInput("HEMAT10")}>HEMAT10</span>,
                              <span className="font-mono font-bold text-indigo-500 cursor-pointer" onClick={() => setVoucherCodeInput("PROMO20")}>PROMO20</span>,
                              <span className="font-mono font-bold text-indigo-500 cursor-pointer" onClick={() => setVoucherCodeInput("DISKON10K")}>DISKON10K</span>,
                              <span className="font-mono font-bold text-indigo-500 cursor-pointer" onClick={() => setVoucherCodeInput("KASIRKU")}>KASIRKU</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-medium" style={{ color: textSecondary }}>
                      <span>Subtotal</span>
                      <span>Rp {cartSubtotal.toLocaleString("id-ID")}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between font-bold text-emerald-600">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Potongan Diskon
                        </span>
                        <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                      </div>
                    )}
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
                        Rp {grandTotalWithTip.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Quick Cash Buttons */}
                  {grandTotalWithTip > 0 && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => setAmountPaid(grandTotalWithTip)}
                          className="py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer"
                          style={{
                            backgroundColor: `${primaryColor}20`,
                            color: primaryColor,
                            borderColor: `${primaryColor}40`,
                          }}
                        >
                          Uang Pas
                        </button>
                        <button
                          onClick={() => setAmountPaid(Math.ceil(grandTotalWithTip / 50000) * 50000 || 50000)}
                          className="py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer"
                          style={{
                            backgroundColor: innerBoxBg,
                            borderColor: cardBorder,
                            color: textPrimary,
                          }}
                        >
                          Rp {(Math.ceil(grandTotalWithTip / 50000) * 50000 || 50000).toLocaleString("id-ID")}
                        </button>
                        <button
                          onClick={() => setAmountPaid(Math.ceil(grandTotalWithTip / 100000) * 100000 || 100000)}
                          className="py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer"
                          style={{
                            backgroundColor: innerBoxBg,
                            borderColor: cardBorder,
                            color: textPrimary,
                          }}
                        >
                          Rp {(Math.ceil(grandTotalWithTip / 100000) * 100000 || 100000).toLocaleString("id-ID")}
                        </button>
                      </div>

                      {/* Cash Input */}
                      <div>
                        <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                          Uang Tunai Diterima (Rp):
                        </label>
                        <input
                          type="number"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          placeholder="Nominal uang kasir..."
                          className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          style={{
                            backgroundColor: inputBg,
                            borderColor: cardBorder,
                            color: textPrimary,
                          }}
                        />
                      </div>

                      {/* Kembalian */}
                      {parsedPaid >= grandTotalWithTip && (
                        <div
                          className="p-2.5 rounded-xl flex items-center justify-between text-xs font-black border"
                          style={{
                            backgroundColor: `${primaryColor}15`,
                            borderColor: `${primaryColor}30`,
                            color: primaryColor,
                          }}
                        >
                          <span>Kembalian:</span>
                          <span className="text-base font-black">
                            Rp {change.toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={
                      loading ||
                      cart.length === 0 ||
                      parsedPaid < grandTotalWithTip ||
                      !activeShift
                    }
                    style={{
                      backgroundColor:
                        cart.length === 0 || parsedPaid < grandTotalWithTip || !activeShift
                          ? "#94a3b8"
                          : primaryColor,
                      borderRadius: radius,
                      boxShadow: `0 6px 20px ${primaryColor}40`,
                    }}
                    className="w-full py-3.5 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer"
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
              </>
            )}
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

      {/* 2.5 Modal Rekap Kas Shift (Live Summary) */}
      {showShiftSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div
            className="rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 border transition-all my-8 max-h-[90vh] flex flex-col"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              color: textPrimary,
              borderRadius: radius,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3.5 flex-shrink-0" style={{ borderColor: cardBorder }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-black text-sm" style={{ color: textPrimary }}>
                    Laporan Rekapitulasi Kas &amp; Omzet Shift
                  </h3>
                  <p className="text-[11px]" style={{ color: textSecondary }}>
                    Ringkasan performa penjualan dan mutasi uang kas pada shift yang sedang berjalan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowShiftSummaryModal(false)}
                className="text-slate-400 hover:opacity-80 p-1 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {loadingShiftSummary ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-xs font-semibold">Mengambil data rekap kas shift...</p>
              </div>
            ) : liveShiftSummary ? (
              <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
                {/* Header Info Banner */}
                <div className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-[11px]" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                  <div>
                    <span className="opacity-60 block">Kasir Bertugas:</span>
                    <strong className="text-xs font-black">{liveShiftSummary.cashierName}</strong>
                  </div>
                  <div>
                    <span className="opacity-60 block">Cabang Outlet:</span>
                    <strong className="text-xs font-black">{liveShiftSummary.outletName}</strong>
                  </div>
                  <div>
                    <span className="opacity-60 block">Waktu Buka:</span>
                    <strong className="text-xs font-mono">{new Date(liveShiftSummary.openedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</strong>
                  </div>
                  <div>
                    <span className="opacity-60 block">Modal Awal:</span>
                    <strong className="text-xs font-mono text-emerald-600">Rp {Number(liveShiftSummary.openingCash || 0).toLocaleString("id-ID")}</strong>
                  </div>
                </div>

                {/* 4 Financial KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl border space-y-1" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Omzet Kotor</span>
                    <p className="text-base font-black text-indigo-600 font-mono">
                      Rp {Number(liveShiftSummary.grossSalesTotal || 0).toLocaleString("id-ID")}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">{liveShiftSummary.totalTransactions} Transaksi</span>
                  </div>

                  <div className="p-3.5 rounded-2xl border space-y-1" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penjualan Tunai (Cash)</span>
                    <p className="text-base font-black text-emerald-600 font-mono">
                      Rp {Number(liveShiftSummary.cashSalesTotal || 0).toLocaleString("id-ID")}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">Masuk ke laci</span>
                  </div>

                  <div className="p-3.5 rounded-2xl border space-y-1" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Non-Tunai (QRIS/TRF)</span>
                    <p className="text-base font-black text-cyan-600 font-mono">
                      Rp {Number(liveShiftSummary.nonCashTotal || 0).toLocaleString("id-ID")}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">QRIS/Transfer/Kartu</span>
                  </div>

                  <div className="p-3.5 rounded-2xl border space-y-1" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Uang Kas di Laci (Ekspektasi)</span>
                    <p className="text-base font-black text-amber-500 font-mono">
                      Rp {Number(liveShiftSummary.expectedCash || 0).toLocaleString("id-ID")}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">Modal + Cash + In - Out</span>
                  </div>
                </div>

                {/* Grid 2 Kolom: Rincian Pembayaran & Rincian Arus Kas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Kolom 1: Breakdown Metode Bayar */}
                  <div className="p-4 rounded-2xl border space-y-2.5" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <h4 className="font-bold text-xs flex items-center justify-between" style={{ color: textPrimary }}>
                      <span>💳 Rincian Metode Pembayaran</span>
                      <span className="text-[10px] text-slate-400 font-mono">{liveShiftSummary.totalTransactions} Transaksi</span>
                    </h4>
                    <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: cardBorder }}>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5"><DollarSign className="w-3 h-3 text-emerald-500" /> Tunai (Cash):</span>
                        <span className="font-mono font-bold">Rp {Number(liveShiftSummary.cashSalesTotal || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5"><ScanBarcode className="w-3 h-3 text-cyan-500" /> QRIS:</span>
                        <span className="font-mono font-bold">Rp {Number(liveShiftSummary.qrisSalesTotal || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 text-indigo-500" /> Transfer Bank:</span>
                        <span className="font-mono font-bold">Rp {Number(liveShiftSummary.transferSalesTotal || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5"><Layers className="w-3 h-3 text-purple-500" /> Kartu Debit/Kredit:</span>
                        <span className="font-mono font-bold">Rp {Number(liveShiftSummary.cardSalesTotal || 0).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kolom 2: Rekonsiliasi Kas Laci */}
                  <div className="p-4 rounded-2xl border space-y-2.5" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <h4 className="font-bold text-xs flex items-center justify-between" style={{ color: textPrimary }}>
                      <span>💵 Rekonsiliasi Kas Fisik Laci</span>
                      <span className="text-[10px] text-amber-500 font-bold">Wajib dihitung</span>
                    </h4>
                    <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: cardBorder }}>
                      <div className="flex justify-between items-center py-1">
                        <span>Modal Awal Kasir:</span>
                        <span className="font-mono font-semibold">+ Rp {Number(liveShiftSummary.openingCash || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span>Penjualan Kas (Cash Sales):</span>
                        <span className="font-mono font-semibold text-emerald-600">+ Rp {Number(liveShiftSummary.cashSalesTotal || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span>Kas Masuk Tambahan:</span>
                        <span className="font-mono font-semibold text-emerald-600">+ Rp {Number(liveShiftSummary.cashIn || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span>Kas Keluar Operasional:</span>
                        <span className="font-mono font-semibold text-rose-500">- Rp {Number(liveShiftSummary.cashOut || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t font-black" style={{ borderColor: cardBorder }}>
                        <span>Uang Fisik Seharusnya:</span>
                        <span className="font-mono text-sm text-indigo-600">Rp {Number(liveShiftSummary.expectedCash || 0).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Produk Terlaris Shift Ini */}
                {liveShiftSummary.topProducts && liveShiftSummary.topProducts.length > 0 && (
                  <div className="p-4 rounded-2xl border space-y-2" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <h4 className="font-bold text-xs" style={{ color: textPrimary }}>
                      🔥 Produk Paling Laku pada Shift Ini
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {liveShiftSummary.topProducts.map((tp: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl border flex items-center justify-between" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                          <div className="overflow-hidden mr-2">
                            <p className="font-bold truncate text-xs">{tp.name}</p>
                            <p className="text-[10px] text-slate-400">Rp {Number(tp.subtotal).toLocaleString("id-ID")}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 font-mono font-bold text-xs">
                            {tp.qty}x
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daftar Transaksi Terakhir di Shift Ini */}
                <div className="p-4 rounded-2xl border space-y-2" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs" style={{ color: textPrimary }}>
                      📋 Riwayat Transaksi Shift Ini ({liveShiftSummary.recentTransactions?.length || 0})
                    </h4>
                  </div>
                  {liveShiftSummary.recentTransactions && liveShiftSummary.recentTransactions.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {liveShiftSummary.recentTransactions.map((trx: any) => (
                        <div
                          key={trx.id}
                          className="p-2.5 rounded-xl border flex items-center justify-between text-[11px] gap-2"
                          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                        >
                          <div className="space-y-0.5 overflow-hidden">
                            <p className="font-bold font-mono text-slate-800 dark:text-slate-200">{trx.transactionNumber}</p>
                            <p className="text-[10px] text-slate-400 truncate">{trx.itemsSummary}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold font-mono text-emerald-600">Rp {trx.totalAmount.toLocaleString("id-ID")}</p>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {trx.paymentMethod}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 py-3 text-center">Belum ada transaksi penjualan pada shift ini.</p>
                  )}
                </div>
              </div>
            ) : null}

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2 flex-shrink-0" style={{ borderColor: cardBorder }}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl border font-bold text-xs transition flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                  style={{ borderColor: cardBorder }}
                  title="Cetak Ringkasan Shift ke Printer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cetak Z-Report</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowShiftSummaryModal(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-xs transition"
                  style={{ backgroundColor: innerBoxBg, borderColor: cardBorder, color: textPrimary }}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowShiftSummaryModal(false);
                    openCloseShiftModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Tutup Shift Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Tutup Shift & Rekonsiliasi */}
      {showCloseShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div
            className="rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border transition-all my-8 max-h-[90vh] flex flex-col"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              color: textPrimary,
              borderRadius: radius,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3 flex-shrink-0" style={{ borderColor: cardBorder }}>
              <h3 className="font-black text-sm flex items-center gap-2" style={{ color: textPrimary }}>
                <Lock className="w-4 h-4 text-rose-500" />
                Tutup Shift Kasir &amp; Rekonsiliasi Kas
              </h3>
              {!closeShiftSummary && (
                <button
                  onClick={() => setShowCloseShiftModal(false)}
                  className="text-slate-400 hover:opacity-80 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {closeShiftSummary ? (
              <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-emerald-600 text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Shift Berhasil Ditutup!
                    </p>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {new Date(closeShiftSummary.closedAt).toLocaleTimeString("id-ID")} WIB
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-emerald-500/30" style={{ color: textPrimary }}>
                    <div className="flex justify-between py-0.5">
                      <span>Kasir / Outlet:</span>
                      <span className="font-bold">{closeShiftSummary.cashierName} • {closeShiftSummary.outletName}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>Total Omzet Kotor (Gross):</span>
                      <span className="font-bold font-mono text-indigo-600">
                        Rp {Number(closeShiftSummary.grossSalesTotal || 0).toLocaleString("id-ID")} ({closeShiftSummary.totalTransactions} Trx)
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>Modal Awal Kas:</span>
                      <span className="font-mono font-bold">
                        Rp {Number(closeShiftSummary.openingCash || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>Total Penjualan Tunai (Cash):</span>
                      <span className="font-mono font-bold text-emerald-600">
                        + Rp {Number(closeShiftSummary.cashSalesTotal || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>Total Non-Tunai (QRIS/TRF/Card):</span>
                      <span className="font-mono font-bold text-cyan-600">
                        Rp {Number(closeShiftSummary.nonCashTotal || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>Total Kas Masuk (In):</span>
                      <span className="font-mono font-bold text-emerald-600">
                        + Rp {Number(closeShiftSummary.cashIn || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>Total Kas Keluar (Out):</span>
                      <span className="font-mono font-bold text-rose-500">
                        - Rp {Number(closeShiftSummary.cashOut || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-emerald-500/30 pt-1.5 font-bold text-xs">
                      <span>Uang Fisik Seharusnya di Laci:</span>
                      <span className="font-mono">
                        Rp {Number(closeShiftSummary.expectedCash || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-xs">
                      <span>Uang Fisik Dihitung Kasir:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400">
                        Rp {Number(closeShiftSummary.closingCash || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between font-black border-t border-emerald-500/30 pt-1.5 text-xs">
                      <span>Selisih Kas (Discrepancy):</span>
                      <span
                        className={`font-mono font-black ${
                          Number(closeShiftSummary.difference) === 0
                            ? "text-emerald-600"
                            : Number(closeShiftSummary.difference) > 0
                            ? "text-blue-600"
                            : "text-rose-600"
                        }`}
                      >
                        {Number(closeShiftSummary.difference) > 0 ? "+" : ""}
                        Rp {Number(closeShiftSummary.difference || 0).toLocaleString("id-ID")}
                        {Number(closeShiftSummary.difference) === 0 ? " (Uang Pas ✓)" : Number(closeShiftSummary.difference) > 0 ? " (Uang Lebih)" : " (Uang Kurang ⚠️)"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 py-3 rounded-2xl border font-bold text-xs transition flex items-center justify-center gap-1.5"
                    style={{ borderColor: cardBorder }}
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cetak Struk Z-Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={finishCloseShift}
                    className="flex-1 py-3 rounded-2xl text-white font-extrabold shadow-md transition"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Selesai &amp; Keluar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCloseShift} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600">
                    {error}
                  </div>
                )}

                {/* Ringkasan Realtime Sebelum Tutup */}
                {liveShiftSummary && (
                  <div className="p-3.5 rounded-2xl border space-y-1.5" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Total Transaksi:</span>
                      <strong className="font-mono">{liveShiftSummary.totalTransactions} Transaksi</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Total Penjualan Tunai:</span>
                      <strong className="font-mono text-emerald-600">Rp {Number(liveShiftSummary.cashSalesTotal || 0).toLocaleString("id-ID")}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Ekspektasi Uang di Laci:</span>
                      <strong className="font-mono text-indigo-600 text-xs">Rp {Number(liveShiftSummary.expectedCash || 0).toLocaleString("id-ID")}</strong>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold mb-1" style={{ color: textSecondary }}>
                    Hitung &amp; Masukkan Uang Fisik Aktual di Laci Kasir (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    placeholder="Hitung seluruh uang fisik di laci..."
                    className="w-full px-3 py-2.5 rounded-xl border text-sm font-mono font-black focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    style={{
                      backgroundColor: inputBg,
                      borderColor: cardBorder,
                      color: textPrimary,
                    }}
                  />
                  {closingCash !== "" && liveShiftSummary && (() => {
                    const diff = Number(closingCash) - Number(liveShiftSummary.expectedCash || 0);
                    return (
                      <div className={`mt-2 p-2 rounded-xl border flex items-center justify-between text-[11px] font-bold ${
                        diff === 0
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                          : diff > 0
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-600"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-600"
                      }`}>
                        <span>Pratinjau Selisih Kas:</span>
                        <span className="font-mono font-black">
                          {diff > 0 ? "+" : ""}Rp {diff.toLocaleString("id-ID")} {diff === 0 ? "(Uang Pas ✓)" : diff > 0 ? "(Uang Lebih)" : "(Uang Kurang ⚠️)"}
                        </span>
                      </div>
                    );
                  })()}
                  <p className="text-[10px] mt-1.5" style={{ color: textSecondary }}>
                    Sistem akan otomatis merekonsiliasi seluruh transaksi dan mencatat laporan selisih kas ke database.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCloseShiftModal(false)}
                    className="flex-1 py-2.5 rounded-xl font-bold border transition cursor-pointer"
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
                    disabled={loading || closingCash === ""}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold shadow-md transition cursor-pointer"
                  >
                    {loading ? "Memproses..." : "Tutup Shift & Rekonsiliasi"}
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
          subtotal: Number(trx?.subtotalAmount || trx?.totalAmount || 0),
          discountAmount: Number(trx?.discountAmount || 0),
          taxPb1Amount: Number(trx?.taxAmount || 0),
          grandTotal: Number(trx?.totalAmount || 0),
          paymentMethod: trx?.paymentMethod || "CASH",
          amountPaid: Number(trx?.amountPaid || trx?.totalAmount || 0),
          changeAmount: Number(trx?.change || Math.max(0, (trx?.amountPaid || trx?.totalAmount || 0) - (trx?.totalAmount || 0))),
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

      {/* 5. Modal Pilih / Tambah Pelanggan (CRM Fase 4) */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 border transition-all animate-in zoom-in-95"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              color: textPrimary,
              borderRadius: radius,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cardBorder }}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black" style={{ color: textPrimary }}>
                    {isCreatingCustomer ? "Daftarkan Pelanggan Baru" : "Pilih Pelanggan (CRM)"}
                  </h3>
                  <p className="text-[11px]" style={{ color: textSecondary }}>
                    {isCreatingCustomer
                      ? "Input data pelanggan baru langsung dari kasir"
                      : "Cari data pelanggan tersimpan untuk transaksi ini"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setIsCreatingCustomer(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!isCreatingCustomer ? (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ketik nama atau no WhatsApp..."
                    value={customerSearchQuery}
                    onChange={(e) => handleSearchCustomer(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{
                      backgroundColor: inputBg,
                      borderColor: cardBorder,
                      color: textPrimary,
                    }}
                  />
                  {customerSearchLoading && (
                    <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" />
                  )}
                </div>

                {/* Results List */}
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {customerSearchResults.length > 0 ? (
                    customerSearchResults.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => handleSelectCustomer(cust)}
                        className="w-full p-2.5 rounded-xl border text-left flex items-center justify-between hover:border-indigo-500 hover:bg-indigo-50/30 transition group cursor-pointer"
                        style={{
                          backgroundColor: innerBoxBg,
                          borderColor: cardBorder,
                        }}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate group-hover:text-indigo-600">
                            {cust.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                            {cust.phone && <span>{cust.phone}</span>}
                            {cust.notes && <span className="italic text-amber-600 truncate max-w-[120px]">({cust.notes})</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            {cust.visits || 0}x hadir
                          </span>
                        </div>
                      </button>
                    ))
                  ) : customerSearchQuery.trim() !== "" && !customerSearchLoading ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Pelanggan &quot;{customerSearchQuery}&quot; belum terdaftar.
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[11px] text-slate-400">
                      Ketik nama atau nomor kontak pelanggan untuk mencari.
                    </div>
                  )}
                </div>

                {/* Switch to Create New Customer */}
                <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: cardBorder }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCustomer(true);
                      setNewCustomerForm({
                        name: customerSearchQuery,
                        phone: "",
                        notes: "",
                        address: "",
                      });
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Daftarkan &quot;{customerSearchQuery || "Pelanggan Baru"}&quot;</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateCustomerFromPos} className="space-y-3">
                {newCustomerError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{newCustomerError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                    Nama Pelanggan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Nama lengkap / panggilan"
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textPrimary }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    placeholder="08123456789"
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textPrimary }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                    Catatan / Preferensi Khusus (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Alergi susu, Fade tipis, Parfum lavender"
                    value={newCustomerForm.notes}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textPrimary }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: cardBorder }}>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustomer(false)}
                    className="flex-1 py-2 rounded-xl border text-xs font-bold transition cursor-pointer"
                    style={{ backgroundColor: innerBoxBg, borderColor: cardBorder, color: textPrimary }}
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={newCustomerLoading}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {newCustomerLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Simpan &amp; Pilih</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. Modal Terima Bayar Live Order (Fase 5) */}
      {selectedLiveOrderForPay && (
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
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                  Pembayaran Live Order
                </span>
                <h3 className="font-black text-sm" style={{ color: textPrimary }}>
                  {selectedLiveOrderForPay.orderNumber} ({selectedLiveOrderForPay.tableNumber || selectedLiveOrderForPay.customerName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLiveOrderForPay(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmLiveOrderPayment} className="space-y-3.5 text-xs">
              {/* Ringkasan Item */}
              <div className="p-2.5 rounded-xl border space-y-1" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                <div className="text-[11px] font-bold text-slate-500 mb-1">Rincian Pesanan:</div>
                {selectedLiveOrderForPay.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="text-slate-700 dark:text-slate-300">
                      {item.qty}x {item.name}
                    </span>
                    <span className="font-mono text-slate-500">
                      Rp {(item.price * item.qty).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-1 mt-1 flex justify-between font-black text-xs" style={{ borderColor: cardBorder }}>
                  <span style={{ color: textPrimary }}>Total Tagihan:</span>
                  <span className="text-indigo-600">
                    Rp {selectedLiveOrderForPay.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                  Metode Pembayaran:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLiveOrderPaymentMethod("CASH")}
                    className={`py-2 rounded-xl font-bold border text-xs flex items-center justify-center gap-1 transition cursor-pointer ${
                      liveOrderPaymentMethod === "CASH"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }`}
                    style={{ borderColor: cardBorder }}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Tunai (Cash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLiveOrderPaymentMethod("QRIS")}
                    className={`py-2 rounded-xl font-bold border text-xs flex items-center justify-center gap-1 transition cursor-pointer ${
                      liveOrderPaymentMethod === "QRIS"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }`}
                    style={{ borderColor: cardBorder }}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QRIS Dinamis</span>
                  </button>
                </div>
              </div>

              {/* Input Uang Kasir */}
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                  Nominal Diterima Kasir (Rp):
                </label>
                <input
                  type="number"
                  required
                  min={selectedLiveOrderForPay.totalAmount}
                  value={liveOrderPaidInput}
                  onChange={(e) => setLiveOrderPaidInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textPrimary }}
                />
              </div>

              {/* Kembalian Preview */}
              {Number(liveOrderPaidInput) >= selectedLiveOrderForPay.totalAmount && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs font-black text-emerald-600">
                  <span>Kembalian Kasir:</span>
                  <span className="font-mono text-sm">
                    Rp {(Number(liveOrderPaidInput) - selectedLiveOrderForPay.totalAmount).toLocaleString("id-ID")}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t" style={{ borderColor: cardBorder }}>
                <button
                  type="button"
                  onClick={() => setSelectedLiveOrderForPay(null)}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer"
                  style={{ backgroundColor: innerBoxBg, borderColor: cardBorder, color: textPrimary }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processingLiveOrder || Number(liveOrderPaidInput) < selectedLiveOrderForPay.totalAmount}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {processingLiveOrder ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Lunas &amp; Cetak</span>
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

