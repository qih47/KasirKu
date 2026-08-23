export type BusinessVertical = "BARBERSHOP" | "CAFE" | "RETAIL" | "LAUNDRY" | "GENERAL";

export type ReceiptDividerStyle = "DASHED" | "DOUBLE" | "SOLID" | "ASTERISK" | "BOX" | "MINIMAL";
export type ReceiptFontScale = "COMPACT" | "NORMAL" | "SPACIOUS";
export type ReceiptTemplateStyle =
  | "DEFAULT"
  | "FORE_CLEAN"
  | "RETRO_COFFEE"
  | "VINTAGE_BARBER"
  | "GENTLEMAN_LOUNGE"
  | "RESTO_KITCHEN"
  | "RETAIL_BARCODE"
  | "COMPACT_ECO"
  | "LAUNDRY_TRACKING"
  | "EXPRESS_LAUNDRY"
  | "LUXURY_MINIMAL";

export interface DynamicCouponConfig {
  enabled: boolean;
  couponCode: string;
  discountText: string;
  expiryDays: number;
}

export interface KitchenTicketConfig {
  enabled: boolean;
  autoPrint: boolean;
  hidePrices: boolean;
  noteHeader: string;
}

export interface ReceiptConfig {
  vertical?: BusinessVertical;
  templateStyle?: ReceiptTemplateStyle;
  dividerStyle?: ReceiptDividerStyle;
  fontScale?: ReceiptFontScale;
  logoUrl?: string | null;
  showLogo: boolean;
  legalName?: string; // PT / Badan Usaha
  showLegalName: boolean;
  outletName?: string;
  showOutletName: boolean;
  npwp?: string; // NPWP / SST ID / Tax ID
  showNpwp: boolean;
  showQueueNumber: boolean; // Nomor Antrean Besar
  showTableNumber: boolean; // Badge Nomor Meja
  tableNumberText?: string;
  orderType: string; // "Dine In" | "Take Away" | "Express" | dll
  showOrderType: boolean;
  headerText: string;
  showHeader: boolean;
  showAddress: boolean;
  address?: string;
  showPhone: boolean;
  phone?: string;
  showCashier: boolean;
  cashierLabel?: string; // "Kasir" | "Capster/Stylist" | "Operator"
  showDateTime: boolean;
  showInvoiceNo: boolean;
  showItemModifiers: boolean; // Varian / Note (Less Ice, Normal Sweet, Fade, dll)
  showItemCount: boolean; // Item Count : X
  showDiscount: boolean;
  discountPercent: number;
  showTax: boolean; // PPN 11% / 12%
  taxPercent: number;
  showPb1: boolean; // PB1 Pajak Resto 10%
  pb1Percent: number;
  showServiceCharge: boolean;
  servicePercent: number;
  showAdminFee?: boolean; // Biaya Admin Transaksi Flat
  adminFeeAmount?: number;
  taxCalculationType?: "EXCLUSIVE" | "INCLUSIVE";
  autoPrintReceipt?: boolean;
  showRounding: boolean; // Pembulatan (Rounding Adjustment)
  roundingAmount?: number;
  showPaymentDetail: boolean;
  paymentMethodText?: string; // QRIS BCA / Tunai / Debit
  showWifi: boolean;
  wifiSsid?: string;
  wifiPassword?: string;
  showSocialMedia: boolean;
  socialMediaText?: string; // Instagram / Website
  showPromoBanner: boolean;
  promoBannerText?: string; // Program Loyalty / Promo Aplikasi
  showQrCode: boolean;
  qrCodeText?: string;
  footerText: string;
  showFooter: boolean;
  showPoweredBy: boolean;
  paperSize: "58mm" | "80mm";
  dynamicCoupon?: DynamicCouponConfig;
  kitchenTicket?: KitchenTicketConfig;
  purchasedThemeIds?: string[]; // Daftar ID tema struk yang sudah dibeli oleh tenant
  posLayout?: "STANDARD" | "CAFE_QUICK_ORDER" | "CAFE_RESTO" | "BARBERSHOP_STATION" | "RETAIL_FAST_BARCODE" | "LAUNDRY_WEIGHING";
  purchasedLayoutIds?: string[]; // Daftar ID tema layout POS yang sudah dibeli oleh tenant
}

// Receipt Theme Metadata for Store Catalog
export interface ReceiptThemeItem {
  id: ReceiptTemplateStyle;
  name: string;
  vertical: BusinessVertical;
  verticalLabel: string;
  badge: string;
  priceMonthly: number;
  priceAnnual: number;
  description: string;
  dividerStyle: ReceiptDividerStyle;
  fontScale: ReceiptFontScale;
  sampleItems: { name: string; qty: number; price: number; mods?: string[] }[];
}

export const RECEIPT_THEMES_CATALOG: ReceiptThemeItem[] = [
  // ☕ CAFE & RESTO
  {
    id: "FORE_CLEAN",
    name: "Fore Clean Modern",
    vertical: "CAFE",
    verticalLabel: "Cafe & F&B",
    badge: "Best Seller",
    priceMonthly: 29000,
    priceAnnual: 290000,
    description: "Desain minimalis bersih, nomor order besar dengan border modern, modifiers terstruktur, dan loyalty banner.",
    dividerStyle: "DASHED",
    fontScale: "NORMAL",
    sampleItems: [
      { name: "Regular Iced Cafe Latte", qty: 1, price: 29000, mods: ["Normal Shot", "Fresh Milk", "Normal Ice"] },
      { name: "Butterscotch Sea Salt Latte", qty: 1, price: 33000, mods: ["Normal Sweet", "No Tumbler"] },
    ],
  },
  {
    id: "RETRO_COFFEE",
    name: "Retro Coffee Lounge",
    vertical: "CAFE",
    verticalLabel: "Cafe & F&B",
    badge: "Vintage",
    priceMonthly: 29000,
    priceAnnual: 290000,
    description: "Gaya klasik coffee shop autentik dengan nomor meja tebal, rincian PB1 resto & password WiFi menonjol.",
    dividerStyle: "DOUBLE",
    fontScale: "NORMAL",
    sampleItems: [
      { name: "Manual Brew V60 Gayo", qty: 1, price: 32000, mods: ["Single Origin", "Hot"] },
      { name: "Croissant Almond Toast", qty: 1, price: 28000, mods: ["Warm Served"] },
    ],
  },

  // 💈 BARBERSHOP & SALON
  {
    id: "VINTAGE_BARBER",
    name: "Vintage Classic Barber",
    vertical: "BARBERSHOP",
    verticalLabel: "Barbershop",
    badge: "Popular",
    priceMonthly: 29000,
    priceAnnual: 290000,
    description: "Garis ganda klasik retro, highlight Capster/Stylist, nomor kursi station, dan link WA booking online.",
    dividerStyle: "DOUBLE",
    fontScale: "NORMAL",
    sampleItems: [
      { name: "Gentlemen Haircut + Wash", qty: 1, price: 65000, mods: ["Fade Cut", "Hair Tonic"] },
      { name: "Matte Clay Pomade 100gr", qty: 1, price: 85000 },
    ],
  },
  {
    id: "GENTLEMAN_LOUNGE",
    name: "Modern Gentleman Lounge",
    vertical: "BARBERSHOP",
    verticalLabel: "Barbershop",
    badge: "Exclusive",
    priceMonthly: 29000,
    priceAnnual: 290000,
    description: "Tampilan modern maskulin untuk barbershop premium dengan highlight kartu member & promo haircut.",
    dividerStyle: "SOLID",
    fontScale: "SPACIOUS",
    sampleItems: [
      { name: "Signature Haircut & Shave", qty: 1, price: 95000, mods: ["Hot Towel", "Beard Trim"] },
      { name: "Hair Styling Clay", qty: 1, price: 110000 },
    ],
  },

  // 🛒 RETAIL & MINIMARKET
  {
    id: "RETAIL_BARCODE",
    name: "Supermarket Fast Barcode",
    vertical: "RETAIL",
    verticalLabel: "Retail & Mart",
    badge: "High Speed",
    priceMonthly: 29000,
    priceAnnual: 290000,
    description: "Format padat hemat kertas, ringkasan total item count, dan barcode SKU transaksi kasir.",
    dividerStyle: "SOLID",
    fontScale: "COMPACT",
    sampleItems: [
      { name: "Minyak Goreng 2L Pouch", qty: 1, price: 34500 },
      { name: "Sabun Cuci Piring 750ml", qty: 2, price: 27000 },
      { name: "Biskuit Cokelat Kaleng", qty: 1, price: 42000 },
    ],
  },
  {
    id: "COMPACT_ECO",
    name: "Compact Eco Slip",
    vertical: "RETAIL",
    verticalLabel: "Retail & Mart",
    badge: "Eco Paper",
    priceMonthly: 29000,
    priceAnnual: 290000,
    description: "Format super ramping hemat gulungan kertas thermal hingga 35%, ideal untuk kasir dengan trafik tinggi.",
    dividerStyle: "MINIMAL",
    fontScale: "COMPACT",
    sampleItems: [
      { name: "Air Mineral Botol 600ml", qty: 3, price: 10500 },
      { name: "Snack Kentang 68gr", qty: 2, price: 19000 },
    ],
  },

  // 🧺 LAUNDRY SERVICE
  {
    id: "LAUNDRY_TRACKING",
    name: "Clean & Fresh Tracking Slip",
    vertical: "LAUNDRY",
    verticalLabel: "Laundry",
    badge: "Tracking",
    priceMonthly: 29000,
    priceAnnual: 290000,
    description: "Highlight nomor rak slot, tanggal estimasi selesai cuci, dan QR Code status tracking pakaian.",
    dividerStyle: "BOX",
    fontScale: "NORMAL",
    sampleItems: [
      { name: "Cuci Komplit Kiloan (3.5 Kg)", qty: 1, price: 35000, mods: ["Parfum Lavender", "Lipat Rapi"] },
      { name: "Bed Cover King Size", qty: 1, price: 30000, mods: ["Packaging Vakum"] },
    ],
  },
  {
    id: "EXPRESS_LAUNDRY",
    name: "Express Laundry Note",
    vertical: "LAUNDRY",
    verticalLabel: "Laundry",
    badge: "Express",
    priceMonthly: 29000,
    priceAnnual: 290000,
    description: "Slip nota laundry express dengan rincian DP/Lunas dan ketentuan klaim pakaian 1x24 jam.",
    dividerStyle: "DOUBLE",
    fontScale: "NORMAL",
    sampleItems: [
      { name: "Cuci Kilat 4 Jam (2 Kg)", qty: 1, price: 30000, mods: ["Express Wash"] },
    ],
  },

  // ✨ LUXURY & GENERAL
  {
    id: "LUXURY_MINIMAL",
    name: "Luxury Boutique Signature",
    vertical: "GENERAL",
    verticalLabel: "Boutique & Umum",
    badge: "Luxury",
    priceMonthly: 29000,
    priceAnnual: 290000,
    description: "Tipografi lapang berkelas, garis aksen lembut, signature penutup elegan untuk butik & store eksklusif.",
    dividerStyle: "ASTERISK",
    fontScale: "SPACIOUS",
    sampleItems: [
      { name: "Silk Blouse Noir S", qty: 1, price: 385000 },
      { name: "Leather Belt Caramel", qty: 1, price: 215000 },
    ],
  },
];

// Presets Default
export const barbershopReceiptPreset: ReceiptConfig = {
  vertical: "BARBERSHOP",
  templateStyle: "DEFAULT",
  dividerStyle: "DASHED",
  fontScale: "NORMAL",
  logoUrl: null,
  showLogo: true,
  legalName: "BARBERKU INDONESIA",
  showLegalName: false,
  outletName: "Cabang Utama",
  showOutletName: true,
  npwp: "",
  showNpwp: false,
  showQueueNumber: true,
  showTableNumber: false,
  tableNumberText: "Chair #01",
  orderType: "Walk-In Service",
  showOrderType: false,
  headerText: "Premium Haircuts & Grooming Lounge",
  showHeader: true,
  showAddress: true,
  showPhone: true,
  phone: "+62812-9988-7766 (WA Booking)",
  showCashier: true,
  cashierLabel: "Capster",
  showDateTime: true,
  showInvoiceNo: true,
  showItemModifiers: true,
  showItemCount: true,
  showDiscount: false,
  discountPercent: 10,
  showTax: false,
  taxPercent: 11,
  showPb1: false,
  pb1Percent: 10,
  showServiceCharge: false,
  servicePercent: 5,
  showRounding: false,
  roundingAmount: 0,
  showPaymentDetail: true,
  paymentMethodText: "QRIS / Tunai",
  showWifi: true,
  wifiSsid: "Barberku_Free_WiFi",
  wifiPassword: "gantengmaksimal",
  showSocialMedia: true,
  socialMediaText: "Instagram: @barberku.official",
  showPromoBanner: true,
  promoBannerText: "Dapatkan Gratis 1x Haircut setelah 5x potong rambut (Kartu Member)!",
  showQrCode: true,
  footerText: "Terima kasih telah mempercayakan penampilan Anda kepada kami!",
  showFooter: true,
  showPoweredBy: true,
  paperSize: "58mm",
  purchasedThemeIds: ["FORE_CLEAN"], // Default sample purchased theme for trial/demo
};

export const cafeReceiptPreset: ReceiptConfig = {
  vertical: "CAFE",
  templateStyle: "DEFAULT",
  dividerStyle: "DASHED",
  fontScale: "NORMAL",
  logoUrl: null,
  showLogo: true,
  legalName: "PT FORE KOPI INDONESIA",
  showLegalName: true,
  outletName: "Outlet Klatos",
  showOutletName: true,
  npwp: "85.411.685.2-067.000",
  showNpwp: true,
  showQueueNumber: true,
  showTableNumber: true,
  tableNumberText: "Table 18",
  orderType: "Dine In Order",
  showOrderType: true,
  headerText: "Kopi Nikmat, Suasana Bersahabat",
  showHeader: true,
  showAddress: true,
  showPhone: true,
  phone: "+62877-2638-072",
  showCashier: true,
  cashierLabel: "Kasir",
  showDateTime: true,
  showInvoiceNo: true,
  showItemModifiers: true,
  showItemCount: true,
  showDiscount: false,
  discountPercent: 10,
  showTax: false,
  taxPercent: 11,
  showPb1: true,
  pb1Percent: 10,
  showServiceCharge: true,
  servicePercent: 5,
  showRounding: true,
  roundingAmount: 0,
  showPaymentDetail: true,
  paymentMethodText: "QRIS BCA",
  showWifi: true,
  wifiSsid: "KOPI SISI LAIN",
  wifiPassword: "nongki@kopsil",
  showSocialMedia: true,
  socialMediaText: "Instagram: @kopsisilain.id",
  showPromoBanner: true,
  promoBannerText: "Dapatkan promo cashback dan voucher gratis di aplikasi Fore Coffee!",
  showQrCode: true,
  footerText: "Terima kasih atas kunjungan Anda!",
  showFooter: true,
  showPoweredBy: true,
  paperSize: "58mm",
  purchasedThemeIds: ["FORE_CLEAN"],
};

export const retailReceiptPreset: ReceiptConfig = {
  vertical: "RETAIL",
  templateStyle: "DEFAULT",
  dividerStyle: "SOLID",
  fontScale: "COMPACT",
  logoUrl: null,
  showLogo: true,
  legalName: "PT RETAIL NUSANTARA",
  showLegalName: false,
  outletName: "Bisnis Cabang 01",
  showOutletName: true,
  npwp: "01.234.567.8-901.000",
  showNpwp: false,
  showQueueNumber: false,
  showTableNumber: false,
  tableNumberText: "",
  orderType: "Belanja Langsung",
  showOrderType: false,
  headerText: "Pusat Belanja Hemat & Lengkap",
  showHeader: true,
  showAddress: true,
  showPhone: true,
  phone: "+62813-5566-7788",
  showCashier: true,
  cashierLabel: "Kasir POS #01",
  showDateTime: true,
  showInvoiceNo: true,
  showItemModifiers: false,
  showItemCount: true,
  showDiscount: true,
  discountPercent: 5,
  showTax: true,
  taxPercent: 11,
  showPb1: false,
  pb1Percent: 10,
  showServiceCharge: false,
  servicePercent: 0,
  showRounding: true,
  roundingAmount: 0,
  showPaymentDetail: true,
  paymentMethodText: "Tunai / QRIS",
  showWifi: false,
  wifiSsid: "",
  wifiPassword: "",
  showSocialMedia: false,
  socialMediaText: "",
  showPromoBanner: false,
  promoBannerText: "",
  showQrCode: true,
  footerText: "Barang yang sudah dibeli dapat ditukar maks 1x24 jam dengan struk asli.",
  showFooter: true,
  showPoweredBy: true,
  paperSize: "58mm",
  purchasedThemeIds: ["RETAIL_BARCODE"],
};

export const laundryReceiptPreset: ReceiptConfig = {
  vertical: "LAUNDRY",
  templateStyle: "DEFAULT",
  dividerStyle: "BOX",
  fontScale: "NORMAL",
  logoUrl: null,
  showLogo: true,
  legalName: "BERSIH WANGI LAUNDRY",
  showLegalName: false,
  outletName: "Workshop Sudirman",
  showOutletName: true,
  npwp: "",
  showNpwp: false,
  showQueueNumber: true,
  showTableNumber: true,
  tableNumberText: "Rak B-04",
  orderType: "Cuci Komplit Express 1 Hari",
  showOrderType: true,
  headerText: "Jasa Cuci Kiloan & Satuan Wangi Higienis",
  showHeader: true,
  showAddress: true,
  showPhone: true,
  phone: "+62819-3344-5566 (WA CS)",
  showCashier: true,
  cashierLabel: "Operator",
  showDateTime: true,
  showInvoiceNo: true,
  showItemModifiers: true,
  showItemCount: true,
  showDiscount: false,
  discountPercent: 10,
  showTax: false,
  taxPercent: 11,
  showPb1: false,
  pb1Percent: 10,
  showServiceCharge: false,
  servicePercent: 0,
  showRounding: false,
  roundingAmount: 0,
  showPaymentDetail: true,
  paymentMethodText: "LUNAS (Transfer / Tunai)",
  showWifi: false,
  wifiSsid: "",
  wifiPassword: "",
  showSocialMedia: true,
  socialMediaText: "Instagram: @bersihwangi.laundry",
  showPromoBanner: true,
  promoBannerText: "Kumpulkan 10 kupon nota untuk gratis 3 Kg cuci komplit!",
  showQrCode: true,
  footerText: "Klaim luntur/rusak/hilang maksimal 1x24 jam setelah serah terima pakaian.",
  showFooter: true,
  showPoweredBy: true,
  paperSize: "58mm",
  purchasedThemeIds: ["LAUNDRY_TRACKING"],
};

export const defaultReceiptConfig: ReceiptConfig = barbershopReceiptPreset;
