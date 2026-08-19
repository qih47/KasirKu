/**
 * Universal Commission Types & Contracts (Decoupled & Modular)
 */

export type CommissionSchemeType =
  | "SERVICE_PERCENTAGE"   // Bagi hasil persentase (Barber/Salon/Spa/Cuci Sepatu)
  | "FLAT_PER_ITEM"        // Nominal tetap per item/kepala (Barber/Jasa)
  | "WEIGHT_PIECE_RATE"    // Tarif per Kg atau per potong (Laundry: Setrika/Cuci)
  | "SERVICE_CHARGE_POOL"  // Service charge pool bagi rata shift (Cafe/Resto)
  | "PRODUCT_INCENTIVE";   // Komisi penjualan produk ritel / upselling

export interface StaffCommissionRateConfig {
  staffId: string;
  staffName?: string;
  schemeType: "PERCENTAGE" | "FLAT";
  serviceRate: number; // e.g. 40 (%) atau 15000 (Rp)
  productCommissionRate?: number; // e.g. 5 (%) atau 5000 (Rp per botol)
  tierLabel?: string; // e.g. "Senior Barber", "Junior", "Master"
}

export interface LaundryCommissionConfig {
  ironingRatePerKg: number; // default Rp 900 / Kg
  washingRatePerKg: number; // default Rp 400 / Kg
  specialItemPercentage: number; // default 15% (Jas, Sepatu, Bedcover)
  deliveryRatePerTrip: number; // default Rp 3.000 / trip
}

export interface CafeServicePoolConfig {
  serviceChargePercentage: number; // e.g. 5% atau 10%
  distributionMethod: "EQUAL_SPLIT_PER_SHIFT" | "HOURLY_WEIGHTED";
  upsellBonusPerItem: number; // e.g. Rp 3.000 per signature item
}

export interface RetailIncentiveConfig {
  targetSalesPerShift?: number;
  cashierZeroDiffReward?: number; // e.g. Rp 10.000 jika kas fisik klop
  highMarginSkuBonusRate?: number; // e.g. Rp 2.000 / pcs
}
