import { BusinessVertical } from "./receipt";

export type PosLayoutType =
  | "STANDARD"
  | "CAFE_QUICK_ORDER"
  | "BARBERSHOP_STATION"
  | "RETAIL_FAST_BARCODE"
  | "LAUNDRY_WEIGHING";

export interface PosLayoutItem {
  id: PosLayoutType;
  name: string;
  vertical: BusinessVertical;
  verticalLabel: string;
  badge: string;
  priceMonthly: number;
  priceAnnual: number;
  description: string;
  features: string[];
  workflowDescription: string;
}

export const POS_LAYOUTS_CATALOG: PosLayoutItem[] = [
  {
    id: "CAFE_QUICK_ORDER",
    name: "Cafe & Resto Quick-Order POS",
    vertical: "CAFE",
    verticalLabel: "Cafe & F&B",
    badge: "Pro F&B",
    priceMonthly: 39000,
    priceAnnual: 390000,
    description:
      "Alur kasir kafe & resto dengan pemilih nomor meja cepat, kartu menu visual besar, pop-up kustomisasi varian minuman (sugar, ice, topping), dan tombol cetak tiket dapur otomatis.",
    features: [
      "Peta & Selector Nomor Meja (Table 01 - 24)",
      "Pop-up Kustomisasi Modifiers Minuman & Makanan",
      "Tombol Satu-Klik 'Kirim Pesanan ke Dapur/Bar (KOT)'",
      "Kategori Menu Visual dengan Foto Jelas",
    ],
    workflowDescription: "Kasir pilih meja ➔ Tap menu ➔ Pilih varian (misal: Less Ice) ➔ Kirim pesanan ke Dapur & Bayar.",
  },
  {
    id: "BARBERSHOP_STATION",
    name: "Barbershop & Salon Station POS",
    vertical: "BARBERSHOP",
    verticalLabel: "Barber & Salon",
    badge: "Specialized",
    priceMonthly: 39000,
    priceAnnual: 390000,
    description:
      "Alur kasir barbershop berbasis Station Kursi & Capster/Stylist aktif. Kasir dapat memilih siapa capster yang melayani, memilih paket treatment potong rambut, dan mencatat komisi atau tip.",
    features: [
      "Selector Station Kursi (Chair 1, Chair 2, Chair 3)",
      "Penugasan Capster / Stylist per Item Transaksi",
      "Daftar Treatment Cepat (Haircut, Creambath, Shaving, Pomade)",
      "Input Tip & Bagi Hasil Komisi Barber Otomatis",
    ],
    workflowDescription: "Kasir pilih Kursi/Capster ➔ Pilih paket treatment ➔ Tambah pomade/tonic ➔ Checkout & catat komisi.",
  },
  {
    id: "RETAIL_FAST_BARCODE",
    name: "Supermarket & Retail Fast-Barcode POS",
    vertical: "RETAIL",
    verticalLabel: "Retail & Mart",
    badge: "High Speed",
    priceMonthly: 39000,
    priceAnnual: 390000,
    description:
      "Alur kasir ritel dengan auto-focus scanner barcode, Numpad angka untuk ubah Qty cepat, dan tabel keranjang belanja ringkas.",
    features: [
      "Auto-Focus Barcode Scanner Tanpa Perlu Klik Input",
      "Numpad Angka untuk Ubah Qty / Diskon Cepat",
      "Tabel Ringkasan Keranjang Lebar dengan Total Item Count",
      "Shortcut Tombol Cepat Keyboard Kasir (F1 - F12)",
    ],
    workflowDescription: "Scan barcode SKU beruntun ➔ Ketik Qty via Numpad jika beli banyak ➔ Tekan Spasi/Enter untuk Bayar Tunai/QRIS.",
  },
  {
    id: "LAUNDRY_WEIGHING",
    name: "Laundry Service & Weighing POS",
    vertical: "LAUNDRY",
    verticalLabel: "Laundry",
    badge: "Tracking",
    priceMonthly: 39000,
    priceAnnual: 390000,
    description:
      "Alur kasir laundry kiloan dan satuan dengan input timbangan desimal Kg, pemilihan aroma parfum, penomoran slot rak, dan cetak nota klaim pakaian.",
    features: [
      "Input Timbangan Desimal Kilogram (misal: 3.5 Kg)",
      "Pemilih Slot Rak Penyimpanan (Rak A-01, Rak B-04)",
      "Pilihan Aroma Parfum & Paket Cuci (Express / Reguler)",
      "Pilihan Pembayaran DP (Uang Muka) atau Bayar Lunas di Awal",
    ],
    workflowDescription: "Timbang cucian ➔ Masukkan Kg & pilih parfum ➔ Beri nomor rak ➔ Cetak nota klaim untuk pelanggan.",
  },
];
