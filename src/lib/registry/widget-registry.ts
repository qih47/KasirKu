import {
  PosWidgetId,
  DashboardWidgetId,
  ReceiptBlockType,
  PosSlotItemSchema,
  DashboardSlotItemSchema,
  ReceiptBlockSchema,
} from "@/types/plugin-package";

// ============================================================
// OFFICIAL POS WIDGET REGISTRY
// ============================================================

export interface PosWidgetDefinition {
  id: PosWidgetId;
  name: string;
  category: "navigation" | "catalog" | "cart" | "vertical" | "input";
  description: string;
  defaultColSpan?: number;
  supportedVariants: string[];
}

export const OFFICIAL_POS_WIDGETS: Record<PosWidgetId, PosWidgetDefinition> = {
  "pos.search_bar": {
    id: "pos.search_bar",
    name: "Bar Pencarian & Filter Cepat",
    category: "input",
    description: "Input pencarian nama produk, SKU, dan shortcut filter barcode.",
    defaultColSpan: 12,
    supportedVariants: ["standard", "compact", "floating"],
  },
  "pos.category_pills": {
    id: "pos.category_pills",
    name: "Kategori Produk (Pills / Tab)",
    category: "navigation",
    description: "Daftar filter kategori produk dengan icon dan badge jumlah item.",
    defaultColSpan: 12,
    supportedVariants: ["horizontal_scroll", "wrap_pills", "sidebar_left"],
  },
  "pos.product_grid": {
    id: "pos.product_grid",
    name: "Katalog Grid / List Produk",
    category: "catalog",
    description: "Area utama menampilkan produk, foto, harga, dan stok.",
    defaultColSpan: 12,
    supportedVariants: ["grid_card", "compact_row", "large_photo", "pill_list"],
  },
  "pos.cart_sidebar": {
    id: "pos.cart_sidebar",
    name: "Keranjang Belanja & Checkout",
    category: "cart",
    description: "Daftar belanja aktif, kalkulasi diskon/pajak, dan tombol bayar.",
    defaultColSpan: 12,
    supportedVariants: ["standard_sidebar", "drawer_slide", "bottom_bar"],
  },
  "pos.quick_actions": {
    id: "pos.quick_actions",
    name: "Tombol Aksi Cepat (Quick Actions)",
    category: "navigation",
    description: "Aksi cepat: Cetak Struk Terakhir, Buka Cash Drawer, Cek Shift, Diskon Manual.",
    defaultColSpan: 12,
    supportedVariants: ["row_buttons", "icon_toolbar", "dropdown_menu"],
  },
  "pos.customer_selector": {
    id: "pos.customer_selector",
    name: "Pemilih Pelanggan & Loyalty",
    category: "input",
    description: "Input nama member/pelanggan untuk pencatatan poin atau piutang.",
    defaultColSpan: 6,
    supportedVariants: ["compact_pill", "dropdown_search", "full_card"],
  },
  "pos.table_selector": {
    id: "pos.table_selector",
    name: "Pemilih Nomor Meja (Khusus Cafe/F&B)",
    category: "vertical",
    description: "Pemilih status meja kafe (Meja 01, Meja 02, dsb).",
    defaultColSpan: 6,
    supportedVariants: ["table_pills", "grid_map", "dropdown"],
  },
  "pos.capster_selector": {
    id: "pos.capster_selector",
    name: "Pemilih Capster / Kursi (Khusus Barbershop)",
    category: "vertical",
    description: "Pilihan stylist yang melayani & nomor kursi potong.",
    defaultColSpan: 6,
    supportedVariants: ["stylist_chips", "avatar_row"],
  },
  "pos.weighing_input": {
    id: "pos.weighing_input",
    name: "Input Timbangan Kilogram (Khusus Laundry)",
    category: "vertical",
    description: "Input timbangan berat cucian kiloan (Kg) & pilihan parfum.",
    defaultColSpan: 6,
    supportedVariants: ["numpad_scale", "compact_kg"],
  },
  "pos.numpad_changer": {
    id: "pos.numpad_changer",
    name: "Numpad Angka Jumbo (Khusus Supermarket/Retail)",
    category: "input",
    description: "Kalkulator angka jumbo untuk kasir cepat mengubah Qty tanpa keyboard.",
    defaultColSpan: 12,
    supportedVariants: ["numpad_grid", "compact_numpad"],
  },
  "pos.barcode_scanner_active": {
    id: "pos.barcode_scanner_active",
    name: "Status Scanner Barcode",
    category: "input",
    description: "Indikator auto-focus barcode scanner hardware USB/Bluetooth.",
    defaultColSpan: 6,
    supportedVariants: ["pill_indicator", "floating_badge"],
  },
};

// ============================================================
// OFFICIAL DASHBOARD WIDGET REGISTRY
// ============================================================

export interface DashboardWidgetDefinition {
  id: DashboardWidgetId;
  name: string;
  category: "kpi" | "chart" | "feed" | "navigation";
  description: string;
  defaultColSpan: number;
}

export const OFFICIAL_DASHBOARD_WIDGETS: Record<DashboardWidgetId, DashboardWidgetDefinition> = {
  "dashboard.kpi_revenue": {
    id: "dashboard.kpi_revenue",
    name: "KPI Total Pendapatan",
    category: "kpi",
    description: "Total omzet hari ini / periode terpilih dengan persentase pertumbuhan.",
    defaultColSpan: 3,
  },
  "dashboard.kpi_transactions": {
    id: "dashboard.kpi_transactions",
    name: "KPI Jumlah Transaksi",
    category: "kpi",
    description: "Banyaknya struk/transaksi berhasil yang tercatat.",
    defaultColSpan: 3,
  },
  "dashboard.kpi_average_order": {
    id: "dashboard.kpi_average_order",
    name: "KPI Rata-rata Keranjang (AOV)",
    category: "kpi",
    description: "Average Order Value per transaksi pelanggan.",
    defaultColSpan: 3,
  },
  "dashboard.kpi_active_shift": {
    id: "dashboard.kpi_active_shift",
    name: "KPI Shift Kasir Aktif",
    category: "kpi",
    description: "Status kasir yang sedang login, modal awal, dan waktu buka shift.",
    defaultColSpan: 3,
  },
  "dashboard.sales_chart": {
    id: "dashboard.sales_chart",
    name: "Grafik Tren Penjualan",
    category: "chart",
    description: "Visualisasi grafik garis atau bar tren pendapatan harian/mingguan.",
    defaultColSpan: 8,
  },
  "dashboard.recent_transactions": {
    id: "dashboard.recent_transactions",
    name: "Daftar Transaksi Terakhir",
    category: "feed",
    description: "Feed transaksi terbaru dengan status pembayaran dan tombol detail.",
    defaultColSpan: 4,
  },
  "dashboard.top_products": {
    id: "dashboard.top_products",
    name: "Produk Terlaris (Top Selling)",
    category: "chart",
    description: "Peringkat menu/produk yang paling banyak dibeli pelanggan.",
    defaultColSpan: 4,
  },
  "dashboard.quick_shortcuts": {
    id: "dashboard.quick_shortcuts",
    name: "Menu Pintas Operasional",
    category: "navigation",
    description: "Tombol navigasi kilat ke Buka Kasir, Tambah Produk, Laporan, Pengaturan.",
    defaultColSpan: 12,
  },
  "dashboard.outlet_switch": {
    id: "dashboard.outlet_switch",
    name: "Switcher Cabang / Outlet",
    category: "navigation",
    description: "Filter dropdown untuk melihat metrik outlet spesifik atau konsolidasi.",
    defaultColSpan: 12,
  },
};

// ============================================================
// OFFICIAL RECEIPT BLOCK REGISTRY
// ============================================================

export interface ReceiptBlockDefinition {
  type: ReceiptBlockType;
  name: string;
  description: string;
  defaultAlign: "left" | "center" | "right";
}

export const OFFICIAL_RECEIPT_BLOCKS: Record<ReceiptBlockType, ReceiptBlockDefinition> = {
  HEADER_LOGO: {
    type: "HEADER_LOGO",
    name: "Logo Usaha",
    description: "Gambar logo brand usaha di bagian atas struk.",
    defaultAlign: "center",
  },
  STORE_META: {
    type: "STORE_META",
    name: "Informasi Outlet / Toko",
    description: "Nama cabang, alamat lengkap, dan nomor kontak/WhatsApp toko.",
    defaultAlign: "center",
  },
  DIVIDER: {
    type: "DIVIDER",
    name: "Garis Pembatas",
    description: "Garis pemisah (dashed, solid, double, dotted) antar bagian struk.",
    defaultAlign: "center",
  },
  TRANSACTION_META: {
    type: "TRANSACTION_META",
    name: "Meta Transaksi",
    description: "Nomor invoice, tanggal & jam cetak, nama kasir, tipe order (Dine In/Takeaway).",
    defaultAlign: "left",
  },
  QUEUE_NUMBER: {
    type: "QUEUE_NUMBER",
    name: "Nomor Antrean Jumbo",
    description: "Nomor panggil pesanan besar untuk F&B atau Barbershop.",
    defaultAlign: "center",
  },
  TABLE_META: {
    type: "TABLE_META",
    name: "Info Meja / Station",
    description: "Badge nomor meja kafe atau nomor kursi/capster barbershop.",
    defaultAlign: "center",
  },
  ITEMS_TABLE: {
    type: "ITEMS_TABLE",
    name: "Tabel Daftar Item Belanja",
    description: "Nama produk, qty, harga satuan, varian modifier, dan subtotal.",
    defaultAlign: "left",
  },
  TOTAL_SUMMARY: {
    type: "TOTAL_SUMMARY",
    name: "Ringkasan Total & Pajak",
    description: "Subtotal, Diskon, Pajak PB1/PPN, Service Charge, dan Grand Total.",
    defaultAlign: "right",
  },
  PAYMENT_DETAILS: {
    type: "PAYMENT_DETAILS",
    name: "Rincian Pembayaran & Kembalian",
    description: "Metode bayar (Tunai, QRIS, Transfer), uang diterima, dan uang kembalian.",
    defaultAlign: "left",
  },
  QRIS_CODE: {
    type: "QRIS_CODE",
    name: "Kode QR Dinamis / Statis",
    description: "QR Code untuk pembayaran atau link ulasan Google Review.",
    defaultAlign: "center",
  },
  COUPON_PROMO: {
    type: "COUPON_PROMO",
    name: "Voucher Diskon Pembelian Berikutnya",
    description: "Kupon promo loyalty dengan masa berlaku otomatis.",
    defaultAlign: "center",
  },
  WIFI_INFO: {
    type: "WIFI_INFO",
    name: "Informasi WiFi Kafe",
    description: "SSID dan Password WiFi untuk pelanggan.",
    defaultAlign: "center",
  },
  FOOTER_NOTES: {
    type: "FOOTER_NOTES",
    name: "Catatan Kaki / Ucapan Terima Kasih",
    description: "Pesan penutup, syarat & ketentuan komplain/retur.",
    defaultAlign: "center",
  },
  POWERED_BY: {
    type: "POWERED_BY",
    name: "Branding Qassa POS",
    description: "Teks 'Powered by Qassa POS' di akhir struk.",
    defaultAlign: "center",
  },
};

// ============================================================
// SECURITY & SANITIZATION UTILITIES
// ============================================================

/**
 * Filter and validate POS layout slots:
 * Strips out any unrecognized widget IDs to guarantee safety against unauthorized injections.
 */
export function sanitizePosSlots(
  slots: Array<{ widget: string; order?: number; colSpan?: number; rowSpan?: number; hidden?: boolean; variant?: string }>
) {
  return slots
    .filter((slot) => slot.widget in OFFICIAL_POS_WIDGETS)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Filter and validate Dashboard layout slots:
 * Strips out any unrecognized widget IDs.
 */
export function sanitizeDashboardSlots(
  slots: Array<{ widget: string; order?: number; colSpan?: number; rowSpan?: number; hidden?: boolean; variant?: string }>
) {
  return slots
    .filter((slot) => slot.widget in OFFICIAL_DASHBOARD_WIDGETS)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Filter and validate Receipt blocks:
 * Strips out any unrecognized block types.
 */
export function sanitizeReceiptBlocks(
  blocks: Array<{ type: string; align?: "left" | "center" | "right"; hidden?: boolean; style?: any; props?: any }>
) {
  return blocks.filter((b) => b.type in OFFICIAL_RECEIPT_BLOCKS);
}
