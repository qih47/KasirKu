export type FeatureCategory =
  | "CORE_POS"
  | "REPORTS"
  | "INVENTORY"
  | "STAFF"
  | "CAFE"
  | "BARBER"
  | "LAUNDRY"
  | "RETAIL";

export const CATEGORY_LABELS: Record<FeatureCategory, { name: string; color: string; icon: string }> = {
  CORE_POS: { name: "Kasir POS Utama", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: "ShoppingCart" },
  REPORTS: { name: "Laporan & Analitik", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: "TrendingUp" },
  INVENTORY: { name: "Inventori & Stok", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: "Package" },
  STAFF: { name: "Staff & Otorisasi", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: "Users" },
  CAFE: { name: "Vertikal: Cafe & Resto", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: "Coffee" },
  BARBER: { name: "Vertikal: Barbershop", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", icon: "Scissors" },
  LAUNDRY: { name: "Vertikal: Laundry", color: "text-pink-400 bg-pink-500/10 border-pink-500/20", icon: "Shirt" },
  RETAIL: { name: "Vertikal: Retail & Mart", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", icon: "ShoppingBag" },
};

export interface FeatureEntitlement {
  key: string;              // Kode unik fitur misal "REPORT_PROFIT_LOSS"
  name: string;             // Nama fitur yang ramah pengguna
  category: FeatureCategory;
  description: string;      // Penjelasan keuntungan fitur (untuk teks promosi upsell)
  allowedTiers: string[];   // ["starter", "pro", "enterprise"] dsb
  requiredPlugin?: string | null; // "cafe" | "barbershop" | "laundry" | "retail" | null
  isPublicPreview: boolean; // Jika true, UI menampilkan teaser paywall saat terkunci
}
