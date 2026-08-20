"use client";

import { useState, useEffect, useRef } from "react";
import { swalWarning, swalConfirm, toastError, toastSuccess } from "@/lib/swal";
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
  PaymentMethod,
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
import { updateTableStatusAction } from "@/plugins/cafe/actions";
import { TableManagementModal } from "./components/table-management-modal";
import { ShiftCashModal } from "./components/shift-cash-modal";
import { CustomerCrmModal } from "./components/customer-crm-modal";
import { PaymentModal, SplitPaymentLine } from "./components/payment-modal";
import { PosHistoryModal } from "./components/history-modal";
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
  PauseCircle,
  PlayCircle,
  Car,
  Banknote,
  Building2,
  CreditCard,
  Zap,
} from "lucide-react";
import QRCode from "qrcode";
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
  activeVouchers?: any[];
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
  activeVouchers = [],
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
  const [isSplitPayment, setIsSplitPayment] = useState<boolean>(false);
  const [splitPayments, setSplitPayments] = useState<SplitPaymentLine[]>([]);


  // Modal States
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showShiftSummaryModal, setShowShiftSummaryModal] = useState(false);
  const [shiftModalActiveTab, setShiftModalActiveTab] = useState<"SUMMARY" | "CASH_MOVEMENT">("SUMMARY");
  const [liveShiftSummary, setLiveShiftSummary] = useState<any | null>(null);
  const [loadingShiftSummary, setLoadingShiftSummary] = useState(false);
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
  const [completedReceiptData, setCompletedReceiptData] = useState<TransactionReceiptData | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const handleReprintFromHistory = (trx: any) => {
    const activeOutlet = shiftData.outlets.find((o) => o.id === trx.outletId || o.id === shiftData.currentOutletId);
    const dateObj = new Date(trx.createdAt || Date.now());
    const formattedDateStr = `${dateObj.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })} ${dateObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })} WIB`;

    const reprintData: TransactionReceiptData = {
      storeName: tenantInfo?.businessName || activeOutlet?.name || "POS STORE",
      legalName: receiptConfig.legalName,
      npwp: receiptConfig.npwp,
      outletName: activeOutlet?.name || "Outlet Utama",
      address: activeOutlet?.address || receiptConfig.address || "Alamat Outlet",
      phone: activeOutlet?.phone || receiptConfig.phone || "",
      headerNote: receiptConfig.headerText,
      logoUrl: receiptConfig.logoUrl || tenantInfo?.logoUrl || null,
      invoiceNo: trx.transactionNumber || `#INV-${Date.now().toString().slice(-6)}`,
      dateTime: formattedDateStr,
      cashierName: trx.shift?.kasir?.name || shiftData.currentUser.name,
      customerName: trx.customer?.name || undefined,
      queueNumber: `#A-01`,
      tableNumber: undefined,
      orderType: "Selesai",
      items: (trx.items || []).map((item: any) => ({
        name: item.product?.name || item.name || "Produk",
        qty: Number(item.qty || 1),
        price: Number(item.price || 0),
        subtotal: Number(item.subtotal || item.qty * item.price),
      })),
      subtotal: Number(trx.subtotalAmount || 0),
      discountAmount: Number(trx.discountAmount || 0),
      taxPb1Amount: 0,
      taxPpnAmount: Number(trx.taxAmount || 0),
      serviceChargeAmount: Number(trx.serviceCharge || 0),
      adminFeeAmount: 0,
      grandTotal: Number(trx.totalAmount || 0),
      paymentMethod: trx.payments?.[0]?.method || "CASH",
      amountPaid: Number(trx.totalAmount || 0),
      changeAmount: 0,
      footerNote: receiptConfig.footerText || "Terima kasih atas kunjungan Anda! (CETAK ULANG)",
    };

    setCompletedReceiptData(reprintData);
    setShowHistoryModal(false);
    setShowReceiptModal(true);
  };

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

  // Multi-Payment Method States (Cash, Dynamic QRIS, Transfer, EDC Card)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("CASH");
  const [qrisSubMethod, setQrisSubMethod] = useState<"DYNAMIC" | "STATIC">("DYNAMIC");
  const [qrisDynamicPaid, setQrisDynamicPaid] = useState<boolean>(false);
  const [showDynamicQrisModal, setShowDynamicQrisModal] = useState<boolean>(false);
  const [dynamicQrisDataUrl, setDynamicQrisDataUrl] = useState<string>("");
  const [transferRefInput, setTransferRefInput] = useState<string>("");

  // Membaca Konfigurasi Struk & Pajak Tenant
  const receiptConfig = tenantInfo?.receiptConfig || {};

  // Quick Printer Setup States
  const [showPrinterSetupModal, setShowPrinterSetupModal] = useState(false);
  const [posPaperSize, setPosPaperSize] = useState<"58mm" | "80mm">((receiptConfig.paperSize as any) || "80mm");
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(receiptConfig.autoPrintReceipt ?? true);

  // POS Screen Layout Detection
  const posLayout: PosLayoutType =
    (tenantInfo?.receiptConfig?.posLayout as PosLayoutType) || "STANDARD";

  // 1. Cafe & Resto Workflow States (Flexible Free Seating vs Table vs Tent Card)
  const [localCafeTables, setLocalCafeTables] = useState<any[]>(cafeTables || []);
  useEffect(() => {
    if (cafeTables) setLocalCafeTables(cafeTables);
  }, [cafeTables]);

  const [showTableManagementModal, setShowTableManagementModal] = useState<boolean>(false);
  const [selectedTable, setSelectedTable] = useState<string>("NO_TABLE");
  const [customTableInput, setCustomTableInput] = useState<string>("");
  const [cartBarcodeQuery, setCartBarcodeQuery] = useState<string>("");
  const cartBarcodeRef = useRef<HTMLInputElement>(null);
  const [isDineIn, setIsDineIn] = useState<boolean>(true);
  const [modifierProduct, setModifierProduct] = useState<any | null>(null);
  const [drinkTemp, setDrinkTemp] = useState<"HOT" | "ICED">("ICED");
  const [drinkSweetness, setDrinkSweetness] = useState<string>("Normal Sweet");
  const [drinkIce, setDrinkIce] = useState<string>("Normal Ice");
  const [drinkMilk, setDrinkMilk] = useState<string>("Fresh Milk");
  const [drinkExtraShot, setDrinkExtraShot] = useState<boolean>(false);
  const [kitchenSlipSent, setKitchenSlipSent] = useState<boolean>(false);

  const handleClearTableStatus = async (tableId: string, tableNumber: string) => {
    const isConfirmed = await swalConfirm(
      `Kosongkan ${tableNumber}?`,
      `Status meja akan diubah kembali menjadi KOSONG dan siap digunakan pelanggan baru.`,
      {
        confirmText: "Ya, Kosongkan Meja",
        cancelText: "Batal",
      }
    );

    if (!isConfirmed) return;

    try {
      await updateTableStatusAction({
        tableId,
        status: "AVAILABLE",
      });

      setLocalCafeTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? { ...t, status: "AVAILABLE", currentGuestName: null, currentOrderNotes: null }
            : t
        )
      );

      if (selectedTable === tableNumber) {
        setSelectedTable("NO_TABLE");
      }

      toastSuccess(`Meja ${tableNumber} kini telah KOSONG!`);
    } catch (err: any) {
      toastError(err.message || "Gagal mengosongkan meja.");
    }
  };

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

  const subtotalAfterDiscount = Math.max(0, cartSubtotal - discountAmount);

  // Hitung Pajak & Biaya Tambahan Tenant (PPN, PB1 Resto, Service Charge, Biaya Admin)
  const pb1Amount = receiptConfig.showPb1
    ? Math.round((subtotalAfterDiscount * Number(receiptConfig.pb1Percent || 10)) / 100)
    : 0;

  const ppnAmount = receiptConfig.showTax
    ? Math.round((subtotalAfterDiscount * Number(receiptConfig.taxPercent || 11)) / 100)
    : 0;

  const serviceChargeAmount = receiptConfig.showServiceCharge
    ? Math.round((subtotalAfterDiscount * Number(receiptConfig.servicePercent || 5)) / 100)
    : 0;

  const adminFeeAmount = receiptConfig.showAdminFee
    ? Number(receiptConfig.adminFeeAmount || 0)
    : 0;

  const totalTaxesAndCharges = pb1Amount + ppnAmount + serviceChargeAmount + adminFeeAmount;

  // Grand Total Belanja (Termasuk Pajak, Biaya Tambahan, dan Tip)
  const totalAmount = subtotalAfterDiscount + totalTaxesAndCharges;
  const grandTotalWithTip = totalAmount + barberTip;

  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const parsedPaid = Number(amountPaid) || 0;
  const change = Math.max(0, parsedPaid - grandTotalWithTip);

  // Generate QRIS Dinamis QR Code Payload
  const generateQris = async (amount: number) => {
    try {
      const rawPayload = `00020101021226670014ID.LINKAJA.WWW0118936009143820011234021500000000000000051440014ID.CO.QRIS.WWW02150000000000000000303UME520458125303360540${amount.toString().length < 10 ? "0" + amount.toString().length : amount.toString().length}${amount}5802ID5913${(tenantInfo?.businessName || "KASIRKU").slice(0, 25).toUpperCase()}6007JAKARTA62070703A016304`;
      const url = await QRCode.toDataURL(rawPayload, {
        width: 320,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      setDynamicQrisDataUrl(url);
    } catch (err) {
      console.error("QR Code generation error:", err);
    }
  };

  useEffect(() => {
    if (showPaymentModal && selectedPaymentMethod === "QRIS" && grandTotalWithTip > 0) {
      generateQris(grandTotalWithTip);
    }
  }, [showPaymentModal, selectedPaymentMethod, grandTotalWithTip]);

  // Handle Verifikasi & Terapkan Voucher
  const handleApplyVoucher = async (overrideCode?: string) => {
    const targetCode = (overrideCode || voucherCodeInput).trim().toUpperCase();
    if (!targetCode) return;
    if (cartSubtotal <= 0) {
      setVoucherError("Tambahkan item ke keranjang terlebih dahulu.");
      return;
    }
    setVoucherLoading(true);
    setVoucherError(null);
    try {
      const result = await verifyVoucherAction(targetCode, cartSubtotal);
      setVoucherCodeInput(result.code);
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
    setDiscountType("PERCENT");
  };

  // Auto-generate QR code saat nominal belanja berubah atau modal QRIS dibuka
  useEffect(() => {
    if (grandTotalWithTip > 0 && (selectedPaymentMethod === "QRIS" || showDynamicQrisModal)) {
      const qrisString = `00020101021226680016ID.CO.KASIRKU.WWW011893600998${shiftData.currentOutletId.slice(0, 10)}520458125303360540${grandTotalWithTip.toString().padStart(6, "0")}5802ID5913${tenantInfo?.businessName?.slice(0, 13) || "KASIRKU"}6007JAKARTA6304`;
      QRCode.toDataURL(qrisString, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setDynamicQrisDataUrl(url))
        .catch((err) => console.error("Gagal generate QRIS:", err));
    }
  }, [grandTotalWithTip, selectedPaymentMethod, showDynamicQrisModal, shiftData.currentOutletId, tenantInfo?.businessName]);

  // Hold Order / Parkir Transaksi States
  interface HeldCartItem {
    id: string;
    label: string;
    cart: CartItemInput[];
    selectedCustomer: any | null;
    discountType: DiscountType;
    discountPercent: number | string;
    discountFixed: number | string;
    appliedVoucher: VoucherValidationResult | null;
    isDineIn: boolean;
    selectedTable: string;
    timestamp: number;
    totalAmount: number;
    laundryWeight?: number;
    laundryFragrance?: string;
    laundryRack?: string;
  }

  const [heldCarts, setHeldCarts] = useState<HeldCartItem[]>([]);
  const [showHeldCartsModal, setShowHeldCartsModal] = useState<boolean>(false);
  const [showHoldPromptModal, setShowHoldPromptModal] = useState<boolean>(false);
  const [holdCartLabelInput, setHoldCartLabelInput] = useState<string>("");

  // Load held carts from localStorage per outlet
  useEffect(() => {
    if (typeof window !== "undefined" && shiftData.currentOutletId) {
      try {
        const stored = localStorage.getItem(`kasirku_held_carts_${shiftData.currentOutletId}`);
        if (stored) {
          setHeldCarts(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load held carts from localStorage", e);
      }
    }
  }, [shiftData.currentOutletId]);

  const saveHeldCarts = (newHeld: HeldCartItem[]) => {
    setHeldCarts(newHeld);
    if (typeof window !== "undefined" && shiftData.currentOutletId) {
      try {
        localStorage.setItem(`kasirku_held_carts_${shiftData.currentOutletId}`, JSON.stringify(newHeld));
      } catch (e) {
        console.error("Failed to save held carts to localStorage", e);
      }
    }
  };

  const handleHoldCurrentCart = () => {
    if (cart.length === 0) {
      swalWarning("Keranjang Kosong", "Tidak ada item di keranjang untuk ditunda.");
      return;
    }

    const newHeldItem: HeldCartItem = {
      id: `HOLD-${Date.now()}`,
      label: holdCartLabelInput.trim() || `Antrean #${heldCarts.length + 1} (${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})`,
      cart: [...cart],
      selectedCustomer,
      discountType,
      discountPercent,
      discountFixed,
      appliedVoucher,
      isDineIn,
      selectedTable,
      timestamp: Date.now(),
      totalAmount: grandTotalWithTip,
      laundryWeight,
      laundryFragrance,
      laundryRack,
    };

    const updated = [newHeldItem, ...heldCarts];
    saveHeldCarts(updated);
    clearCart();
    handleResetDiscount();
    setSelectedCustomer(null);
    setShowHoldPromptModal(false);
    setHoldCartLabelInput("");
    setSuccessMsg(`Transaksi "${newHeldItem.label}" berhasil ditunda!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleRestoreHeldCart = async (heldItem: HeldCartItem) => {
    if (cart.length > 0) {
      const confirmed = await swalConfirm(
        "Ganti Keranjang Aktif?",
        "Ada transaksi aktif di keranjang kasir saat ini. Lanjutkan menimpa dengan transaksi yang ditunda?"
      );
      if (!confirmed) return;
    }

    setCart(heldItem.cart);
    setSelectedCustomer(heldItem.selectedCustomer || null);
    setDiscountType(heldItem.discountType || "PERCENT");
    setDiscountPercent(heldItem.discountPercent || "");
    setDiscountFixed(heldItem.discountFixed || "");
    setAppliedVoucher(heldItem.appliedVoucher || null);
    setIsDineIn(heldItem.isDineIn !== undefined ? heldItem.isDineIn : true);
    setSelectedTable(heldItem.selectedTable || "Meja 01");
    if (heldItem.laundryWeight) setLaundryWeight(heldItem.laundryWeight);
    if (heldItem.laundryFragrance) setLaundryFragrance(heldItem.laundryFragrance);
    if (heldItem.laundryRack) setLaundryRack(heldItem.laundryRack);

    const updated = heldCarts.filter((h) => h.id !== heldItem.id);
    saveHeldCarts(updated);
    setShowHeldCartsModal(false);
    setSuccessMsg(`Transaksi "${heldItem.label}" berhasil dilanjutkan!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeleteHeldCart = async (id: string, label: string) => {
    const confirmed = await swalConfirm("Hapus Transaksi Ditunda?", `Batalkan dan hapus transaksi "${label}"?`);
    if (!confirmed) return;
    const updated = heldCarts.filter((h) => h.id !== id);
    saveHeldCarts(updated);
    setSuccessMsg(`Transaksi "${label}" berhasil dihapus.`);
    setTimeout(() => setSuccessMsg(null), 2500);
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
            imageUrl: product.imageUrl,
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

  // Handle Quick Barcode Scan in Cart
  const handleBarcodeScanSubmit = (query: string) => {
    const clean = query.trim();
    if (!clean) return;
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === clean.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === clean.toLowerCase()) ||
        p.name.toLowerCase() === clean.toLowerCase()
    );
    if (found) {
      addToCart(found);
      setCartBarcodeQuery("");
      setSuccessMsg(`✓ ${found.name} ditambahkan`);
      setTimeout(() => setSuccessMsg(null), 1500);
    } else {
      setError(`Produk dengan barcode/SKU "${clean}" tidak ditemukan.`);
      setTimeout(() => setError(null), 2500);
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
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    if (!activeShift) {
      setError("Shift kasir belum dibuka. Mohon buka shift terlebih dahulu.");
      return;
    }

    if (cart.length === 0) {
      setError("Keranjang belanja masih kosong.");
      return;
    }

    const effectivePaid =
      selectedPaymentMethod === "CASH" ? parsedPaid : grandTotalWithTip;

    if (effectivePaid < grandTotalWithTip) {
      setError("Uang yang dibayarkan kurang dari total tagihan.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const effectiveTableNumber = isDineIn
        ? selectedTable === "CUSTOM_TENT_CARD"
          ? customTableInput.trim() || undefined
          : selectedTable !== "NO_TABLE"
            ? selectedTable
            : undefined
        : undefined;

      const selectedTblObj = isDineIn && selectedTable !== "NO_TABLE" && selectedTable !== "CUSTOM_TENT_CARD"
        ? localCafeTables.find((t: any) => t.tableNumber === selectedTable || t.id === selectedTable)
        : null;

      const res = await createTransactionAction({
        shiftId: activeShift.id,
        outletId: shiftData.currentOutletId,
        customerId: selectedCustomer?.id || null,
        items: cart,
        paymentMethod: selectedPaymentMethod,
        amountPaid: effectivePaid,
        discountType: discountAmount > 0 ? discountType : null,
        discountValue:
          discountType === "PERCENT"
            ? Number(discountPercent)
            : discountType === "FIXED"
              ? Number(discountFixed)
              : appliedVoucher?.discountValue || 0,
        discountAmount,
        voucherCode: discountType === "VOUCHER" && appliedVoucher ? appliedVoucher.code : null,
        taxAmount: pb1Amount + ppnAmount + adminFeeAmount,
        serviceCharge: serviceChargeAmount,
        tableId: isDineIn && selectedTblObj ? selectedTblObj.id : null,
        orderType: isDineIn ? "DINE_IN" : "TAKEAWAY",
        splitPayments: isSplitPayment && splitPayments.length > 0 ? splitPayments : undefined,
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
        if (selectedTblObj) {
          setLocalCafeTables((prev) =>
            prev.map((t) => (t.id === selectedTblObj.id ? { ...t, status: "OCCUPIED" } : t))
          );
        }

        setShowPaymentModal(false);
        setShowDynamicQrisModal(false);
        setQrisDynamicPaid(false);

        const trx = res.transaction;
        const activeOutlet = shiftData.outlets.find((o) => o.id === shiftData.currentOutletId);
        
        // Format stable date/time string (DD/MM/YYYY HH:mm WIB)
        const dateObj = new Date(trx?.createdAt || Date.now());
        const formattedDateStr = `${dateObj.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })} ${dateObj.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })} WIB`;

        const fixedReceiptData: TransactionReceiptData = {
          storeName: tenantInfo?.businessName || activeOutlet?.name || "POS STORE",
          legalName: receiptConfig.legalName,
          npwp: receiptConfig.npwp,
          outletName: activeOutlet?.name || "Outlet Utama",
          address: activeOutlet?.address || receiptConfig.address || "Alamat Outlet",
          phone: activeOutlet?.phone || receiptConfig.phone || "",
          headerNote: receiptConfig.headerText,
          logoUrl: receiptConfig.logoUrl || tenantInfo?.logoUrl || null,
          invoiceNo: trx?.receiptNumber || `#INV-${Date.now().toString().slice(-6)}`,
          dateTime: formattedDateStr,
          cashierName: shiftData.currentUser.name,
          customerName: selectedCustomer?.name || trx?.customerName || undefined,
          queueNumber: trx?.queueNumber || res.queueNumber || `#A-01`,
          tableNumber: effectiveTableNumber,
          orderType: isDineIn ? "Dine In" : "Take Away",
          items: cart.map((item: any) => ({
            name: item.name || "Produk",
            qty: Number(item.qty || 1),
            price: Number(item.price || 0),
            subtotal: Number(item.qty * item.price),
            notes: item.notes || item.modifiersText || undefined,
          })),
          subtotal: Number(trx?.subtotalAmount || cartSubtotal || 0),
          discountAmount: Number(trx?.discountAmount || discountAmount || 0),
          taxPb1Amount: pb1Amount,
          taxPpnAmount: ppnAmount,
          serviceChargeAmount: Number(trx?.serviceCharge || serviceChargeAmount || 0),
          adminFeeAmount: adminFeeAmount,
          barberTip: barberTip,
          grandTotal: Number(trx?.totalAmount || grandTotalWithTip || 0),
          paymentMethod: trx?.paymentMethod || selectedPaymentMethod || "CASH",
          amountPaid: Number(trx?.amountPaid || (selectedPaymentMethod === "CASH" ? parsedPaid : grandTotalWithTip)),
          changeAmount: Number(trx?.change || (selectedPaymentMethod === "CASH" ? change : 0)),
          footerNote: receiptConfig.footerText || "Terima kasih atas kunjungan Anda!",
          coupon: receiptConfig.dynamicCoupon?.enabled
            ? {
                code: receiptConfig.dynamicCoupon.couponCode || "DISKON10",
                text: receiptConfig.dynamicCoupon.discountText || "Diskon transaksi berikutnya",
              }
            : undefined,
          wifi: receiptConfig.showWifi && receiptConfig.wifiSsid
            ? {
                ssid: receiptConfig.wifiSsid,
                password: receiptConfig.wifiPassword || "",
              }
            : undefined,
        };

        setCompletedReceiptData(fixedReceiptData);
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

        // Refresh live summary data
        try {
          const updatedSummary = await getLiveShiftSummaryAction(activeShift.id);
          setLiveShiftSummary(updatedSummary);
        } catch (_) {}

        setMovementAmount("");
        setMovementNote("");
        toastSuccess(
          `Kas ${movementType === "IN" ? "Masuk" : "Keluar"} sebesar Rp ${Number(res.movement.amount).toLocaleString("id-ID")} berhasil dicatat!`
        );
      }
    } catch (err: any) {
      setError(err.message || "Gagal mencatat mutasi kas.");
      toastError(err.message || "Gagal mencatat mutasi kas.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Buka Modal Rekap & Mutasi Kas Shift Live
  const openLiveShiftSummary = async (tab: "SUMMARY" | "CASH_MOVEMENT" = "SUMMARY") => {
    if (!activeShift) return;
    setShiftModalActiveTab(tab);
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          {activeShift ? (
            <>
              {/* Tunda Transaksi Button in Top Bar */}
              <button
                type="button"
                onClick={() => setShowHeldCartsModal(true)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-xs cursor-pointer ${heldCarts.length > 0
                    ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 ring-2 ring-amber-400/30 animate-pulse"
                    : ""
                  }`}
                style={
                  heldCarts.length === 0
                    ? { backgroundColor: innerBoxBg, borderColor: cardBorder, color: textPrimary }
                    : {}
                }
                title="Daftar Transaksi yang Ditunda"
              >
                <PauseCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden md:inline">Tertunda</span>
                {heldCarts.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
                    {heldCarts.length}
                  </span>
                )}
              </button>

              {/* Riwayat Transaksi Button in Top Bar */}
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-xs cursor-pointer hover:border-indigo-400"
                style={{ backgroundColor: innerBoxBg, borderColor: cardBorder, color: textPrimary }}
                title="Riwayat Transaksi (Cetak Ulang & Void)"
              >
                <History className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden md:inline">Riwayat</span>
              </button>

              {/* Manajemen Meja Kasir Button in Top Bar */}
              {localCafeTables && localCafeTables.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTableManagementModal(true)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-xs cursor-pointer ${
                    localCafeTables.some((t) => t.status === "OCCUPIED")
                      ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                      : ""
                  }`}
                  style={
                    !localCafeTables.some((t) => t.status === "OCCUPIED")
                      ? { backgroundColor: innerBoxBg, borderColor: cardBorder, color: textPrimary }
                      : {}
                  }
                  title="Manajemen Status Meja Resto (Kosongkan Meja)"
                >
                  <span className="text-sm">🪑</span>
                  <span className="hidden md:inline">Meja</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/60 dark:bg-black/40">
                    {localCafeTables.filter((t) => t.status === "OCCUPIED").length > 0
                      ? `${localCafeTables.filter((t) => t.status === "OCCUPIED").length} Terisi`
                      : `${localCafeTables.length} Meja`}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => openLiveShiftSummary("SUMMARY")}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-xs cursor-pointer"
                style={{
                  backgroundColor: innerBoxBg,
                  borderColor: cardBorder,
                  color: textPrimary,
                }}
                title="Laporan Rekapitulasi Kas, Omzet, dan Mutasi Kas Masuk/Keluar"
              >
                <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden md:inline">Kas & Rekap</span>
              </button>

              {/* Quick Printer Setup Button */}
              <button
                type="button"
                onClick={() => setShowPrinterSetupModal(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer"
                style={{
                  backgroundColor: innerBoxBg,
                  borderColor: cardBorder,
                  color: textPrimary,
                }}
                title="Pengaturan Cepat Printer Kasir & Ukuran Kertas"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden lg:inline font-mono">{posPaperSize}</span>
              </button>

              <button
                onClick={openCloseShiftModal}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-800 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tutup Shift</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <Clock className="w-4 h-4" />
              <span>Buka Shift</span>
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
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition flex-shrink-0 ${selectedChair === chair
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
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${showNumpad ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600"
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

            {/* Product Cards Grid - Modern Responsive Density */}
            <div
              className={`flex-1 p-3 overflow-y-auto grid ${dynamicPosLayout?.productGridColumns === 3
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-3 gap-3"
                  : dynamicPosLayout?.productGridColumns === 6
                    ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2"
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3"
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
                      backgroundColor: inCart ? (isDark ? `${primaryColor}25` : `${primaryColor}12`) : cardBg,
                      borderColor: inCart ? primaryColor : cardBorder,
                      borderRadius: radius,
                      boxShadow: inCart ? `0 0 12px ${primaryColor}25` : isDark ? "0 4px 15px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                    className={`p-2.5 sm:p-3 border text-left flex flex-col justify-between transition-all relative overflow-hidden group cursor-pointer ${isOutOfStock ? "opacity-40 cursor-not-allowed" : "hover:border-indigo-400 hover:shadow-md active:scale-[0.98]"
                      }`}
                  >
                    {inCart && (
                      <span
                        className="absolute top-2 right-2 w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-md z-10 animate-scaleUp"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {inCart.qty}
                      </span>
                    )}

                    {/* Product Thumbnail in Grid */}
                    <div className="w-full h-24 sm:h-28 mb-2 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/80 border border-black/5 dark:border-white/5 flex-shrink-0 flex items-center justify-center relative">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 opacity-60" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider block opacity-60 truncate" style={{ color: textSecondary }}>
                        {p.category}
                      </span>
                      <h4 className="text-xs font-bold line-clamp-2 mt-0.5 leading-tight" style={{ color: textPrimary }}>
                        {p.name}
                      </h4>
                    </div>

                    <div
                      className="mt-2.5 pt-2 border-t flex items-center justify-between gap-1 w-full"
                      style={{ borderColor: cardBorder }}
                    >
                      <span className="text-xs font-black font-mono truncate" style={{ color: primaryColor }}>
                        Rp {Number(p.price).toLocaleString("id-ID")}
                      </span>

                      {p.type === "BARANG" ? (
                        (p.stockQty ?? 0) <= 0 ? (
                          <span className="text-[9.5px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded shrink-0">
                            Habis
                          </span>
                        ) : (p.stockQty ?? 0) <= (p.minStockAlert ?? 5) ? (
                          <span className="text-[9.5px] font-bold text-amber-500 bg-amber-500/15 px-1.5 py-0.2 rounded shrink-0">
                            Stok {p.stockQty}
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-semibold text-slate-400 shrink-0">
                            {p.stockQty ?? 0} pcs
                          </span>
                        )
                      ) : (
                        <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded shrink-0">
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
            className="w-80 md:w-[350px] lg:w-[380px] flex flex-col border-l flex-shrink-0 shadow-lg transition-all duration-300"
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
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${posCartTab === "MANUAL"
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
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 relative cursor-pointer ${posCartTab === "LIVE_ORDERS"
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
                    className={`text-[10px] px-1.5 rounded-full font-black ${posCartTab === "LIVE_ORDERS" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
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
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${order.status === "PENDING"
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
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" style={{ color: primaryColor }} />
                    <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: textPrimary }}>
                      Keranjang ({totalItemsCount})
                    </h3>
                  </div>

                  {cart.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setHoldCartLabelInput("");
                          setShowHoldPromptModal(true);
                        }}
                        className="text-[10px] text-amber-700 dark:text-amber-300 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 transition"
                        title="Tunda transaksi ini untuk melayani antrean lain"
                      >
                        <PauseCircle className="w-3 h-3" />
                        <span>Tunda</span>
                      </button>
                      <button
                        onClick={clearCart}
                        className="text-[10px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer px-1"
                      >
                        Kosongkan
                      </button>
                    </div>
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
                    cart.map((item, cIdx) => {
                      const productObj = products.find((p) => p.id === item.productId);
                      const itemThumbnail = item.imageUrl || productObj?.imageUrl;

                      return (
                        <div
                          key={item.productId}
                          onClick={() => setSelectedCartIdx(cIdx)}
                          className={`p-2.5 border flex items-center justify-between gap-2.5 transition cursor-pointer ${selectedCartIdx === cIdx ? "ring-2 ring-indigo-500/50" : ""
                            }`}
                          style={{
                            backgroundColor: innerBoxBg,
                            borderColor: cardBorder,
                            borderRadius: `calc(${radius} * 0.7)`,
                          }}
                        >
                          {/* Product Thumbnail */}
                          <div
                            className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/80 border flex-shrink-0 flex items-center justify-center relative shadow-2xs"
                            style={{ borderColor: cardBorder }}
                          >
                            {itemThumbnail ? (
                              <img
                                src={itemThumbnail}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400 opacity-60" />
                            )}
                          </div>

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
                              <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
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
                            className="p-1 text-slate-400 hover:text-rose-500 ml-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
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
                  {/* ⚡ Quick-Scan Barcode Input (Khusus Retail & Minimarket) */}
                  {(posLayout === "RETAIL_FAST_BARCODE" || tenantInfo?.receiptConfig?.vertical === "RETAIL") && (
                    <div
                      className="p-2 rounded-xl border flex items-center gap-2 shadow-2xs"
                      style={{ borderColor: cardBorder, backgroundColor: cardBg }}
                    >
                      <ScanBarcode className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <input
                        ref={cartBarcodeRef}
                        type="text"
                        value={cartBarcodeQuery}
                        onChange={(e) => setCartBarcodeQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleBarcodeScanSubmit(cartBarcodeQuery);
                          }
                        }}
                        placeholder="⚡ Scan Barcode / Ketik SKU [Enter]..."
                        className="w-full text-xs font-mono font-bold bg-transparent border-0 focus:outline-none placeholder:text-slate-400 placeholder:font-sans"
                        style={{ color: textPrimary }}
                      />
                      {cartBarcodeQuery && (
                        <button
                          type="button"
                          onClick={() => setCartBarcodeQuery("")}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
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
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${barberTip === t ? "bg-amber-600 text-white" : "bg-white text-slate-600"
                              }`}
                          >
                            +{t / 1000}k
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RINGKASAN TAGIHAN KERANJANG */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-medium" style={{ color: textSecondary }}>
                      <span>Subtotal</span>
                      <span className="font-mono font-bold">Rp {cartSubtotal.toLocaleString("id-ID")}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between font-bold text-emerald-600">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Potongan Diskon
                        </span>
                        <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    {pb1Amount > 0 && (
                      <div className="flex items-center justify-between font-medium text-stone-600 dark:text-stone-300">
                        <span>PB1 Resto ({receiptConfig.pb1Percent || 10}%)</span>
                        <span className="font-mono font-bold">+ Rp {pb1Amount.toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    {ppnAmount > 0 && (
                      <div className="flex items-center justify-between font-medium text-stone-600 dark:text-stone-300">
                        <span>PPN ({receiptConfig.taxPercent || 11}%)</span>
                        <span className="font-mono font-bold">+ Rp {ppnAmount.toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    {serviceChargeAmount > 0 && (
                      <div className="flex items-center justify-between font-medium text-stone-600 dark:text-stone-300">
                        <span>Service Charge ({receiptConfig.servicePercent || 5}%)</span>
                        <span className="font-mono font-bold">+ Rp {serviceChargeAmount.toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    {adminFeeAmount > 0 && (
                      <div className="flex items-center justify-between font-medium text-stone-600 dark:text-stone-300">
                        <span>Biaya Admin</span>
                        <span className="font-mono font-bold">+ Rp {adminFeeAmount.toLocaleString("id-ID")}</span>
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

                  {/* Submit Button to Open Payment Modal */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!activeShift) {
                        setShowOpenShiftModal(true);
                        return;
                      }
                      if (cart.length === 0) return;
                      setShowPaymentModal(true);
                      if (selectedPaymentMethod === "CASH" && (!amountPaid || Number(amountPaid) === 0)) {
                        setAmountPaid(grandTotalWithTip);
                      }
                      if (selectedPaymentMethod === "QRIS") {
                        generateQris(grandTotalWithTip);
                      }
                    }}
                    disabled={loading || cart.length === 0 || !activeShift}
                    style={{
                      backgroundColor:
                        cart.length === 0 || !activeShift ? "#94a3b8" : primaryColor,
                      borderRadius: radius,
                      boxShadow: `0 6px 20px ${primaryColor}40`,
                    }}
                    className="w-full py-3.5 px-4 text-white font-extrabold text-xs transition flex items-center justify-between shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="font-bold">Pilih Pembayaran &amp; Bayar</span>
                    </div>
                    <span className="font-mono text-sm font-black">
                      Rp {grandTotalWithTip.toLocaleString("id-ID")}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL PEMBAYARAN KASIR (CHECKOUT MODAL DEDICATED - 2 KOLOM LEGA) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`w-full ${isDineIn ? "max-w-5xl" : "max-w-3xl"} rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 border my-auto transition-all duration-300 animate-scaleUp max-h-[94vh] overflow-y-auto`}
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderRadius: radius,
              color: textPrimary,
            }}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cardBorder }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black" style={{ color: textPrimary }}>
                    Penyelesaian Pembayaran Kasir
                  </h3>
                  <p className="text-[11px]" style={{ color: textSecondary }}>
                    {totalItemsCount} item pesanan • Operator: {shiftData.currentUser.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setQrisDynamicPaid(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:opacity-80 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Layanan Bar (Hanya Makan di Tempat & Bawa Pulang Saja Tanpa Dropdown Meja) */}
            <div
              className="p-3 rounded-2xl border flex items-center justify-between gap-3 flex-wrap"
              style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Mode Pesanan:</span>
                <div
                  className="flex items-center gap-1 p-0.5 rounded-xl border"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsDineIn(true);
                      if (!selectedTable) setSelectedTable("NO_TABLE");
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                      isDineIn
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <span>🍽️</span>
                    <span>Makan di Tempat (Dine In)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDineIn(false);
                      setSelectedTable("NO_TABLE");
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                      !isDineIn
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <span>🛍️</span>
                    <span>Bawa Pulang (Take Away)</span>
                  </button>
                </div>
              </div>

              {/* Status Meja Terpilih (Hanya tampil jika kasir memilih meja) */}
              {isDineIn && selectedTable && selectedTable !== "NO_TABLE" && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold">Meja Terpilih:</span>
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-500/15 text-indigo-600 font-black border border-indigo-500/20 flex items-center gap-1.5">
                    <span>🪑 {selectedTable}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTable("NO_TABLE")}
                      className="text-slate-400 hover:text-rose-500 text-xs font-bold leading-none cursor-pointer"
                      title="Batalkan pilihan meja"
                    >
                      &times;
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Grid Modal: Sisi Kiri (Rincian), Sisi Tengah (Metode Bayar), Sisi Kanan (Card Meja saat Dine In) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* SISI KIRI: RINGKASAN BIAYA & MANAJEMEN VOUCHER */}
              <div className={`${isDineIn ? "md:col-span-4" : "md:col-span-5"} space-y-3.5`}>
                {/* Total Tagihan Box */}
                <div
                  className="p-4 rounded-2xl border space-y-1"
                  style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Total Tagihan Pembayaran
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400 block">
                    Rp {grandTotalWithTip.toLocaleString("id-ID")}
                  </span>
                </div>

                {/* Box Manajemen Diskon & Voucher Lengkap */}
                <div
                  className="p-3.5 rounded-2xl border space-y-2.5"
                  style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: textPrimary }}>
                      <Tag className="w-3.5 h-3.5 text-amber-500" />
                      <span>Diskon &amp; Voucher Promo</span>
                    </span>
                    {discountAmount > 0 && (
                      <button
                        type="button"
                        onClick={handleResetDiscount}
                        className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
                      >
                        Hapus Diskon
                      </button>
                    )}
                  </div>

                  {/* 3 Tab Diskon */}
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType("VOUCHER");
                        setDiscountPercent("");
                        setDiscountFixed("");
                      }}
                      className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                        discountType === "VOUCHER"
                          ? "bg-white dark:bg-slate-900 shadow-sm text-indigo-600 font-black"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Ticket className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Voucher</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType("PERCENT");
                        setAppliedVoucher(null);
                      }}
                      className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                        discountType === "PERCENT"
                          ? "bg-white dark:bg-slate-900 shadow-sm text-indigo-600 font-black"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Persen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType("FIXED");
                        setAppliedVoucher(null);
                      }}
                      className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                        discountType === "FIXED"
                          ? "bg-white dark:bg-slate-900 shadow-sm text-indigo-600 font-black"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Nominal</span>
                    </button>
                  </div>

                  {/* TAB 1: VOUCHER */}
                  {discountType === "VOUCHER" && (
                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={voucherCodeInput}
                          onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === "Enter" && handleApplyVoucher()}
                          placeholder="KODE VOUCHER..."
                          className="flex-1 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold uppercase focus:outline-none"
                          style={{
                            backgroundColor: inputBg,
                            borderColor: cardBorder,
                            color: textPrimary,
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyVoucher()}
                          disabled={voucherLoading || !voucherCodeInput.trim()}
                          className="px-3 py-1.5 rounded-xl text-white font-extrabold text-xs shadow transition disabled:opacity-50 cursor-pointer"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {voucherLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Terapkan"}
                        </button>
                      </div>

                      {voucherError && (
                        <p className="text-[11px] text-rose-500 font-bold">⚠️ {voucherError}</p>
                      )}

                      {appliedVoucher && (
                        <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-600 flex items-center justify-between">
                          <span>✓ {appliedVoucher.code} ({appliedVoucher.description})</span>
                          <span>- Rp {appliedVoucher.discountAmount.toLocaleString("id-ID")}</span>
                        </div>
                      )}

                      {/* Chip Voucher Aktif Milik Owner */}
                      {activeVouchers.length > 0 && (
                        <div className="space-y-1 pt-1 border-t" style={{ borderColor: cardBorder }}>
                          <span className="text-[10px] text-slate-400 font-bold block">Pilih Cepat Voucher:</span>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {activeVouchers.map((v: any) => {
                              const isSel = appliedVoucher?.code === v.code;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => {
                                    setVoucherCodeInput(v.code);
                                    handleApplyVoucher(v.code);
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer border ${
                                    isSel
                                      ? "bg-emerald-500 text-white border-emerald-500"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                                  }`}
                                >
                                  🏷️ {v.code}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: DISKON PERSEN */}
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
                            className={`flex-1 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              Number(discountPercent) === p
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
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
                        placeholder="Atau ketik persen diskon kustom..."
                        className="w-full px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none"
                        style={{
                          backgroundColor: inputBg,
                          borderColor: cardBorder,
                          color: textPrimary,
                        }}
                      />
                    </div>
                  )}

                  {/* TAB 3: DISKON NOMINAL */}
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
                            className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              Number(discountFixed) === f
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
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
                </div>

                {/* Rincian Subtotal, Pajak & Biaya */}
                <div
                  className="p-3.5 rounded-2xl border space-y-1.5 text-xs font-medium"
                  style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
                >
                  <div className="flex justify-between" style={{ color: textSecondary }}>
                    <span>Subtotal Produk ({totalItemsCount} item)</span>
                    <span className="font-mono">Rp {cartSubtotal.toLocaleString("id-ID")}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Potongan Diskon</span>
                      <span className="font-mono">- Rp {discountAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {pb1Amount > 0 && (
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>PB1 Resto ({receiptConfig.pb1Percent || 10}%)</span>
                      <span className="font-mono font-bold">+ Rp {pb1Amount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {ppnAmount > 0 && (
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>PPN ({receiptConfig.taxPercent || 11}%)</span>
                      <span className="font-mono font-bold">+ Rp {ppnAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {serviceChargeAmount > 0 && (
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>Service Charge ({receiptConfig.servicePercent || 5}%)</span>
                      <span className="font-mono font-bold">+ Rp {serviceChargeAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {adminFeeAmount > 0 && (
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>Biaya Admin Transaksi</span>
                      <span className="font-mono font-bold">+ Rp {adminFeeAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {barberTip > 0 && (
                    <div className="flex justify-between text-amber-600 font-bold">
                      <span>Tip Stylist</span>
                      <span className="font-mono">+ Rp {barberTip.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm pt-2 border-t" style={{ borderColor: cardBorder, color: textPrimary }}>
                    <span>Total Tagihan:</span>
                    <span className="font-mono" style={{ color: primaryColor }}>
                      Rp {grandTotalWithTip.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* SISI TENGAH / KANAN: METODE PEMBAYARAN & INPUT KASIR */}
              <div className={`${isDineIn ? "md:col-span-4" : "md:col-span-7"} space-y-3.5`}>
                {/* Switcher Mode: Single vs Split Payment */}
                <div className="flex items-center justify-between p-1 rounded-2xl border" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSplitPayment(false);
                      setSplitPayments([]);
                      if (selectedPaymentMethod === "CASH" && (!amountPaid || Number(amountPaid) === 0)) {
                        setAmountPaid(grandTotalWithTip);
                      }
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      !isSplitPayment
                        ? "bg-indigo-600 text-white shadow-sm font-black"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pembayaran Penuh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSplitPayment(true);
                      if (splitPayments.length === 0) {
                        const half = Math.floor(grandTotalWithTip / 2);
                        setSplitPayments([
                          { method: "CASH", amount: half },
                          { method: "QRIS", amount: grandTotalWithTip - half },
                        ]);
                      }
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSplitPayment
                        ? "bg-indigo-600 text-white shadow-sm font-black"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Split Bill (Multi-Metode)</span>
                  </button>
                </div>

                {isSplitPayment ? (
                  /* KONTEN MODE SPLIT PAYMENT */
                  <div className="space-y-3 p-3.5 rounded-2xl border bg-indigo-500/5" style={{ borderColor: cardBorder }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold" style={{ color: textPrimary }}>
                        Pecah Tagihan Pembayaran:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentTotal = splitPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
                          const remaining = Math.max(0, grandTotalWithTip - currentTotal);
                          setSplitPayments([
                            ...splitPayments,
                            { method: "TRANSFER", amount: remaining },
                          ]);
                        }}
                        className="text-[10.5px] font-black text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tambah Baris</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {splitPayments.map((sp, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-xl border" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                          <select
                            value={sp.method}
                            onChange={(e) => {
                              const updated = [...splitPayments];
                              updated[idx].method = e.target.value as PaymentMethod;
                              setSplitPayments(updated);
                            }}
                            className="py-1.5 px-2 rounded-lg border text-xs font-bold focus:outline-none"
                            style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textPrimary }}
                          >
                            <option value="CASH">💵 Tunai</option>
                            <option value="QRIS">📱 QRIS</option>
                            <option value="TRANSFER">🏦 Transfer</option>
                            <option value="CARD">💳 Kartu EDC</option>
                          </select>
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">Rp</span>
                            <input
                              type="number"
                              min={0}
                              value={sp.amount || ""}
                              onChange={(e) => {
                                const updated = [...splitPayments];
                                updated[idx].amount = Number(e.target.value) || 0;
                                setSplitPayments(updated);
                              }}
                              placeholder="0"
                              className="w-full pl-8 pr-2 py-1.5 rounded-lg border text-xs font-mono font-black focus:outline-none"
                              style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textPrimary }}
                            />
                          </div>
                          {splitPayments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setSplitPayments(splitPayments.filter((_, i) => i !== idx))}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              title="Hapus baris ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Ringkasan Split Calculation */}
                    {(() => {
                      const splitTotal = splitPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
                      const diff = splitTotal - grandTotalWithTip;
                      return (
                        <div className="pt-2 border-t space-y-1 text-xs" style={{ borderColor: cardBorder }}>
                          <div className="flex justify-between font-bold">
                            <span>Total Split Terinput:</span>
                            <span className="font-mono">Rp {splitTotal.toLocaleString("id-ID")}</span>
                          </div>
                          {diff < 0 ? (
                            <div className="flex justify-between font-black text-rose-600">
                              <span>Kurang Bayar:</span>
                              <span className="font-mono">Rp {Math.abs(diff).toLocaleString("id-ID")}</span>
                            </div>
                          ) : diff > 0 ? (
                            <div className="flex justify-between font-black text-emerald-600">
                              <span>Kelebihan / Kembalian:</span>
                              <span className="font-mono">Rp {diff.toLocaleString("id-ID")}</span>
                            </div>
                          ) : (
                            <div className="text-center py-1 text-emerald-600 font-black text-[11px]">
                              ✓ Pembagian Split Tagihan Pas (Lunas)
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <>
                    {/* Selector 4 Tab Metode Pembayaran */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold block" style={{ color: textSecondary }}>
                        Pilih Metode Pembayaran:
                      </label>
                      <div
                        className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl border"
                        style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
                      >
                        {[
                          { id: "CASH", label: "Tunai", icon: Banknote },
                          { id: "QRIS", label: "QRIS", icon: QrCode },
                          { id: "TRANSFER", label: "Transfer", icon: Building2 },
                          { id: "CARD", label: "Kartu EDC", icon: CreditCard },
                        ].map((m) => {
                          const isSel = selectedPaymentMethod === m.id;
                          const Icon = m.icon;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedPaymentMethod(m.id as PaymentMethod);
                                if (m.id === "QRIS") {
                                  generateQris(grandTotalWithTip);
                                }
                                if (m.id !== "CASH") {
                                  setAmountPaid(grandTotalWithTip);
                                } else if (!amountPaid || Number(amountPaid) === 0) {
                                  setAmountPaid(grandTotalWithTip);
                                }
                              }}
                              className={`py-2 px-1 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer active:scale-95 ${
                                isSel
                                  ? "bg-indigo-600 text-white shadow-md font-black"
                                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-[10px] tracking-tight">{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* KONTEN TAB 1: TUNAI (CASH) DENGAN PECAHAN LENGKAP */}
                    {selectedPaymentMethod === "CASH" && (() => {
                      const total = grandTotalWithTip;
                      const cashNotes = [5000, 10000, 20000, 50000, 100000, 200000];

                      return (
                        <div className="space-y-3">
                          {/* Pecahan Lengkap Grid */}
                          <div>
                            <label className="block text-[11px] font-bold mb-1.5" style={{ color: textSecondary }}>
                              Pecahan Uang Rupiah Diterima:
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                              {/* Tombol Uang Pas */}
                              <button
                                type="button"
                                onClick={() => setAmountPaid(total)}
                                className={`py-2 px-1 rounded-xl border text-xs font-bold cursor-pointer transition active:scale-95 ${
                                  Number(amountPaid) === total
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm font-black"
                                    : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-400/40 hover:border-indigo-400"
                                }`}
                              >
                                Uang Pas
                              </button>

                              {cashNotes.map((note) => {
                                const isSel = Number(amountPaid) === note;
                                return (
                                  <button
                                    key={note}
                                    type="button"
                                    onClick={() => setAmountPaid(note)}
                                    className={`py-2 px-1 rounded-xl border text-xs font-bold font-mono cursor-pointer transition active:scale-95 ${
                                      isSel
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm font-black"
                                        : "hover:border-indigo-400"
                                    }`}
                                    style={
                                      !isSel
                                        ? {
                                            backgroundColor: innerBoxBg,
                                            borderColor: cardBorder,
                                            color: textPrimary,
                                          }
                                        : undefined
                                    }
                                  >
                                    Rp {note >= 1000 ? `${note / 1000}k` : note}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Cash Input */}
                          <div>
                            <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                              Nominal Uang Tunai Diterima (Rp):
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm font-mono">
                                Rp
                              </span>
                              <input
                                type="number"
                                autoFocus
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                placeholder={grandTotalWithTip.toString()}
                                className="w-full pl-11 pr-4 py-2.5 rounded-2xl border text-lg font-black font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                style={{
                                  backgroundColor: inputBg,
                                  borderColor: cardBorder,
                                  color: textPrimary,
                                }}
                              />
                            </div>
                          </div>

                          {/* Kembalian Banner */}
                          {parsedPaid >= grandTotalWithTip ? (
                            <div className="p-3 rounded-2xl flex items-center justify-between border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
                                  Uang Kembalian Pelanggan
                                </span>
                                <span className="text-xl font-black font-mono">
                                  Rp {change.toLocaleString("id-ID")}
                                </span>
                              </div>
                              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-black">
                                ✓ LUNAS
                              </span>
                            </div>
                          ) : parsedPaid > 0 ? (
                            <div className="p-2.5 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-600 text-xs font-bold flex items-center justify-between">
                              <span>Uang Masih Kurang:</span>
                              <span className="font-mono font-black">
                                Rp {(grandTotalWithTip - parsedPaid).toLocaleString("id-ID")}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      );
                    })()}

                    {/* KONTEN TAB 2: QRIS */}
                    {selectedPaymentMethod === "QRIS" && (
                      <div className="space-y-3.5 text-center">
                        <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-indigo-400/40 shadow-inner flex flex-col items-center justify-center mx-auto max-w-[240px]">
                          {dynamicQrisDataUrl ? (
                            <img
                              src={dynamicQrisDataUrl}
                              alt="QRIS Code"
                              className="w-44 h-44 object-contain rounded-lg"
                            />
                          ) : (
                            <div className="w-44 h-44 flex flex-col items-center justify-center gap-2 text-slate-400">
                              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                              <span className="text-[11px] font-bold">Membuat QR...</span>
                            </div>
                          )}
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                            <span>BCA, GoPay, OVO, ShopeePay, Dana</span>
                          </div>
                          <span className="text-[11px] font-black font-mono text-indigo-700 mt-1">
                            Nominal Pas: Rp {grandTotalWithTip.toLocaleString("id-ID")}
                          </span>
                        </div>

                        {/* Status Menunggu Pembayaran */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                              Menunggu Pembayaran Pelanggan...
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                            Pelanggan dapat scan QR di layar POS atau akrilik meja kasir. Setelah bukti bayar terlihat, kasir klik konfirmasi di bawah.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* KONTEN TAB 3 & 4: TRANSFER BANK & KARTU EDC */}
                    {(selectedPaymentMethod === "TRANSFER" || selectedPaymentMethod === "CARD") && (
                      <div className="space-y-3">
                        <div
                          className="p-4 rounded-2xl border space-y-2"
                          style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
                        >
                          <label className="block text-xs font-bold" style={{ color: textPrimary }}>
                            {selectedPaymentMethod === "TRANSFER"
                              ? "Nomor Referensi / Nama Bank Pengirim (Opsional):"
                              : "Approval Code / 4 Digit Nomor Kartu (Opsional):"}
                          </label>
                          <input
                            type="text"
                            value={transferRefInput}
                            onChange={(e) => setTransferRefInput(e.target.value)}
                            placeholder={
                              selectedPaymentMethod === "TRANSFER"
                                ? "Contoh: BCA - 829102"
                                : "Contoh: Mandiri EDC 4910"
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textPrimary }}
                          />
                          <p className="text-[10px] text-slate-400">
                            * Digunakan untuk mempermudah pencocokan mutasi bank pada laporan kasir.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Action Buttons di Footer Modal */}
                <div className="pt-3 border-t space-y-2" style={{ borderColor: cardBorder }}>
                  <button
                    type="button"
                    onClick={handleProcessPayment}
                    disabled={
                      loading ||
                      cart.length === 0 ||
                      !activeShift ||
                      (isSplitPayment
                        ? splitPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0) < grandTotalWithTip
                        : selectedPaymentMethod === "CASH" && (Number(amountPaid) || 0) < grandTotalWithTip)
                    }
                    style={{
                      backgroundColor:
                        cart.length === 0 ||
                        !activeShift ||
                        (isSplitPayment
                          ? splitPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0) < grandTotalWithTip
                          : selectedPaymentMethod === "CASH" && (Number(amountPaid) || 0) < grandTotalWithTip)
                          ? "#94a3b8"
                          : qrisDynamicPaid
                            ? "#059669"
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
                        <span>
                          {isSplitPayment
                            ? "Bayar Split Bill & Cetak Struk"
                            : selectedPaymentMethod === "CASH"
                              ? "Bayar Tunai & Cetak Struk"
                              : selectedPaymentMethod === "QRIS"
                                ? "Konfirmasi Lunas QRIS & Cetak Struk"
                                : selectedPaymentMethod === "TRANSFER"
                                  ? "Konfirmasi Transfer & Cetak Struk"
                                  : "Konfirmasi Kartu EDC & Cetak Struk"}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setQrisDynamicPaid(false);
                    }}
                    className="w-full py-2.5 rounded-xl border text-xs font-bold transition hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    style={{ borderColor: cardBorder, color: textSecondary }}
                  >
                    Kembali ke Keranjang
                  </button>
                </div>
              </div>

              {/* SISI KANAN: GRID KOTAK-KOTAK PILIHAN MEJA (2 KOLOM LEGA) */}
              {isDineIn && (
                <div
                  className="md:col-span-4 p-4 rounded-2xl border space-y-3 flex flex-col"
                  style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
                >
                  <div className="pb-2.5 border-b flex items-center justify-between" style={{ borderColor: cardBorder }}>
                    <div>
                      <h4 className="text-xs font-black flex items-center gap-1.5" style={{ color: textPrimary }}>
                        <span>🪑 Pilih Meja</span>
                      </h4>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        {selectedTable && selectedTable !== "NO_TABLE"
                          ? `Terpilih: ${selectedTable}`
                          : "Klik meja (Opsional)"}
                      </p>
                    </div>
                    <span className="text-[9.5px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-extrabold">
                      {localCafeTables?.filter((t: any) => t.status !== "OCCUPIED").length || 0} Kosong
                    </span>
                  </div>

                  {/* Grid Kotak-Kotak Meja (2 Kolom Lega) */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-96 pr-0.5">
                    {localCafeTables && localCafeTables.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2.5">
                        {localCafeTables.map((tbl: any) => {
                          const isSelected = selectedTable === tbl.tableNumber;
                          const isOccupied = tbl.status === "OCCUPIED";

                          return (
                            <button
                              key={tbl.id}
                              type="button"
                              disabled={isOccupied}
                              onClick={() => {
                                if (!isOccupied) {
                                  setSelectedTable(isSelected ? "NO_TABLE" : tbl.tableNumber);
                                }
                              }}
                              className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 min-h-[76px] ${
                                isSelected
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300 cursor-pointer"
                                  : isOccupied
                                  ? "opacity-50 bg-slate-100 dark:bg-slate-800/40 border-dashed cursor-not-allowed"
                                  : "hover:border-indigo-400 hover:shadow-xs cursor-pointer"
                              }`}
                              style={{
                                borderColor: isSelected ? primaryColor : isOccupied ? undefined : cardBorder,
                                backgroundColor: isSelected ? primaryColor : isOccupied ? undefined : cardBg,
                              }}
                            >
                              <p
                                className={`text-xs font-black leading-tight text-center whitespace-normal break-words w-full ${
                                  isSelected ? "text-white" : ""
                                }`}
                                style={{ color: isSelected ? "#fff" : textPrimary }}
                              >
                                {tbl.tableNumber}
                              </p>
                              <span className={`text-[9.5px] font-medium ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                                {tbl.capacity || 4} Kursi
                              </span>
                              <span
                                className={`text-[8.5px] font-black px-2 py-0.5 rounded-full mt-0.5 ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : isOccupied
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                }`}
                              >
                                {isSelected ? "✓ Dipilih" : isOccupied ? "Terisi" : "Kosong"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 py-8 text-center">
                        Belum ada data meja resto.
                      </p>
                    )}
                  </div>
                </div>
              )}
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
                      className={`py-1.5 rounded-xl font-bold border transition ${drinkTemp === temp ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-700"
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
                      className={`py-1.5 rounded-lg text-[11px] font-bold border transition ${drinkSweetness === sweet ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700"
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
                        className={`py-1.5 rounded-lg text-[11px] font-bold border transition ${drinkIce === ice ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700"
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
                      className={`py-1.5 rounded-xl font-bold border text-[11px] transition ${drinkMilk === milk.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700"
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
                      imageUrl: modifierProduct.imageUrl,
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

      {/* 2. Modal Manajemen Kas & Rekapitulasi Shift (Modular) */}
      <ShiftCashModal
        isOpen={showShiftSummaryModal}
        onClose={() => setShowShiftSummaryModal(false)}
        activeTab={shiftModalActiveTab}
        setActiveTab={setShiftModalActiveTab}
        loadingSummary={loadingShiftSummary}
        liveShiftSummary={liveShiftSummary}
        activeShift={activeShift}
        movementType={movementType}
        setMovementType={setMovementType}
        movementAmount={movementAmount}
        setMovementAmount={setMovementAmount}
        movementNote={movementNote}
        setMovementNote={setMovementNote}
        handleCashMovement={handleCashMovement}
        loadingMovement={loading}
        onOpenCloseShift={openCloseShiftModal}
        themeStyles={{
          cardBg,
          cardBorder,
          innerBoxBg,
          inputBg,
          textPrimary,
          textSecondary,
          radius,
        }}
      />

      {/* 2.5 Modal Manajemen Meja Resto (Modular) */}
      <TableManagementModal
        isOpen={showTableManagementModal}
        onClose={() => setShowTableManagementModal(false)}
        tables={localCafeTables}
        onClearTable={handleClearTableStatus}
        themeStyles={{
          cardBg,
          cardBorder,
          innerBoxBg,
          textPrimary,
          textSecondary,
          radius,
          primaryColor,
        }}
      />

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
                        className={`font-mono font-black ${Number(closeShiftSummary.difference) === 0
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
                      <div className={`mt-2 p-2 rounded-xl border flex items-center justify-between text-[11px] font-bold ${diff === 0
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
      {showReceiptModal && completedReceiptData && (
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
                {completedReceiptData.invoiceNo}
              </span>
            </div>

            {/* Dynamic Thermal Receipt Renderer - 100% Synced with Owner Template & Receipt Config */}
            <div className="max-h-[60vh] overflow-y-auto rounded-xl p-1 bg-stone-100/50 border border-stone-200">
              <DynamicReceiptRenderer
                config={{
                  ...receiptConfig,
                  paperSize: posPaperSize,
                }}
                data={completedReceiptData}
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: cardBorder }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer"
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
                  setCompletedReceiptData(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-white font-extrabold shadow-md transition cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4b. Modal Quick Setup Printer Kasir */}
      {showPrinterSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border transition-all"
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
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black" style={{ color: textPrimary }}>
                    Pengaturan Cepat Printer POS
                  </h3>
                  <p className="text-[10px]" style={{ color: textSecondary }}>
                    Sesuaikan kertas thermal &amp; opsi cetak kasir
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrinterSetupModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Ukuran Kertas */}
              <div className="space-y-1.5">
                <label className="font-bold block" style={{ color: textPrimary }}>
                  Ukuran Lebar Kertas Thermal:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPosPaperSize("58mm")}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      posPaperSize === "58mm"
                        ? "bg-indigo-600 text-white font-black border-indigo-600 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                    }`}
                  >
                    <span className="block text-sm">58 mm</span>
                    <span className="text-[9px] opacity-80">Mini / Bluetooth POS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosPaperSize("80mm")}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      posPaperSize === "80mm"
                        ? "bg-indigo-600 text-white font-black border-indigo-600 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                    }`}
                  >
                    <span className="block text-sm">80 mm</span>
                    <span className="text-[9px] opacity-80">Standar / USB / LAN</span>
                  </button>
                </div>
              </div>

              {/* Auto-Print Toggle */}
              <label
                className="flex items-center justify-between p-3 rounded-xl border cursor-pointer"
                style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
              >
                <div>
                  <p className="font-bold" style={{ color: textPrimary }}>
                    Otomatis Dialog Cetak
                  </p>
                  <p className="text-[9px]" style={{ color: textSecondary }}>
                    Buka jendela print segera setelah bayar
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoPrintEnabled}
                  onChange={(e) => setAutoPrintEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
              </label>

              {/* Tombol Test Print */}
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                style={{ borderColor: cardBorder, color: textPrimary }}
              >
                <Printer className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tes Cetak Struk Sekarang</span>
              </button>
            </div>

            <div className="pt-2 border-t flex justify-end" style={{ borderColor: cardBorder }}>
              <button
                type="button"
                onClick={() => setShowPrinterSetupModal(false)}
                className="w-full py-2.5 rounded-xl text-white font-black text-xs shadow-md transition cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Simpan &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Pilih / Tambah Pelanggan (CRM Modular) */}
      <CustomerCrmModal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setIsCreatingCustomer(false);
        }}
        isCreatingCustomer={isCreatingCustomer}
        setIsCreatingCustomer={setIsCreatingCustomer}
        customerSearchQuery={customerSearchQuery}
        onSearchQueryChange={handleSearchCustomer}
        customerSearchResults={customerSearchResults}
        customerSearchLoading={customerSearchLoading}
        onSelectCustomer={handleSelectCustomer}
        newCustomerForm={newCustomerForm}
        setNewCustomerForm={setNewCustomerForm}
        newCustomerLoading={newCustomerLoading}
        newCustomerError={newCustomerError}
        onCreateCustomer={handleCreateCustomerFromPos}
        themeStyles={{
          cardBg,
          cardBorder,
          innerBoxBg,
          inputBg,
          textPrimary,
          textSecondary,
          radius,
        }}
      />

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
                    className={`py-2 rounded-xl font-bold border text-xs flex items-center justify-center gap-1 transition cursor-pointer ${liveOrderPaymentMethod === "CASH"
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
                    className={`py-2 rounded-xl font-bold border text-xs flex items-center justify-center gap-1 transition cursor-pointer ${liveOrderPaymentMethod === "QRIS"
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

      {/* 7. Modal Tunda Transaksi (Hold Prompt Input) */}
      {showHoldPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border transition-all"
            style={{ backgroundColor: cardBg, borderColor: cardBorder, borderRadius: radius }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cardBorder }}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600">
                  <PauseCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm" style={{ color: textPrimary }}>
                    Tunda Transaksi Ini
                  </h3>
                  <p className="text-[11px]" style={{ color: textSecondary }}>
                    Simpan sementara keranjang belanja untuk melayani antrean lain
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHoldPromptModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleHoldCurrentCart(); }} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                  Nama Label / Keterangan Antrean (Opsional):
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Misal: Bapak Kemeja Putih, Meja 04, Bu Rina"
                  value={holdCartLabelInput}
                  onChange={(e) => setHoldCartLabelInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textPrimary }}
                />
              </div>

              <div className="p-3 rounded-xl border space-y-1 text-xs" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>Total Item:</span>
                  <span>{totalItemsCount} item</span>
                </div>
                <div className="flex justify-between font-black text-xs" style={{ color: textPrimary }}>
                  <span>Total Tagihan:</span>
                  <span className="text-amber-600 font-mono">Rp {grandTotalWithTip.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t" style={{ borderColor: cardBorder }}>
                <button
                  type="button"
                  onClick={() => setShowHoldPromptModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer"
                  style={{ backgroundColor: innerBoxBg, borderColor: cardBorder, color: textPrimary }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Tunda Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal Daftar Transaksi Ditunda */}
      {showHeldCartsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border transition-all max-h-[85vh] flex flex-col"
            style={{ backgroundColor: cardBg, borderColor: cardBorder, borderRadius: radius }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cardBorder }}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600">
                  <PauseCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm" style={{ color: textPrimary }}>
                    Daftar Transaksi Ditunda ({heldCarts.length})
                  </h3>
                  <p className="text-[11px]" style={{ color: textSecondary }}>
                    Pilih transaksi untuk dilanjutkan pembayarannya atau batalkan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHeldCartsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {heldCarts.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <PauseCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-bold text-slate-500">Tidak ada transaksi yang sedang ditunda.</p>
                  <p className="text-[11px] text-slate-400">Gunakan tombol &quot;Tunda&quot; di keranjang belanja untuk menunda sementara pesanan pelanggan.</p>
                </div>
              ) : (
                heldCarts.map((hItem) => {
                  const timeAgo = new Date(hItem.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                  const itemCount = hItem.cart.reduce((acc, it) => acc + it.qty, 0);

                  return (
                    <div
                      key={hItem.id}
                      className="p-3.5 rounded-2xl border transition-all space-y-2 hover:border-amber-400"
                      style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black" style={{ color: textPrimary }}>
                              {hItem.label}
                            </h4>
                            {hItem.selectedCustomer && (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                                👤 {hItem.selectedCustomer.name}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>Ditunda pukul {timeAgo} WIB</span>
                            <span>&bull;</span>
                            <span>{itemCount} item</span>
                          </span>
                        </div>
                        <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                          Rp {hItem.totalAmount.toLocaleString("id-ID")}
                        </span>
                      </div>

                      {/* Preview items */}
                      <div className="text-[11px] text-slate-500 line-clamp-1 border-t pt-1.5" style={{ borderColor: cardBorder }}>
                        {hItem.cart.map((c) => `${c.qty}x ${c.name}`).join(", ")}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteHeldCart(hItem.id, hItem.label)}
                          className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRestoreHeldCart(hItem)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Lanjutkan Transaksi</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal Riwayat Transaksi (Cetak Ulang Struk & Void Transaksi) */}
      <PosHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        outletId={shiftData.currentOutletId}
        shiftId={activeShift?.id}
        onReprint={handleReprintFromHistory}
      />
    </div>
  );
}

