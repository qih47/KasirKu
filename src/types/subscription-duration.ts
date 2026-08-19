// ============================================================
// SUBSCRIPTION DURATION & DISCOUNT CONFIGURATION
// Mendukung 6 opsi durasi fleksibel (1 Bulan s/d 3 Tahun)
// ============================================================

export type SubscriptionDurationKey = "1M" | "3M" | "6M" | "1Y" | "2Y" | "3Y";

export interface DurationSettingItem {
  key: SubscriptionDurationKey;
  label: string;
  months: number;
  discountPercent: number; // Diskon dalam persen (0 - 100)
  isActive: boolean;
  badgeText?: string;
  isPopular?: boolean;
}

export const DEFAULT_DURATION_SETTINGS: DurationSettingItem[] = [
  {
    key: "1M",
    label: "1 Bulan",
    months: 1,
    discountPercent: 0,
    isActive: true,
    badgeText: "Standar",
  },
  {
    key: "3M",
    label: "3 Bulan",
    months: 3,
    discountPercent: 5,
    isActive: true,
    badgeText: "Hemat 5%",
  },
  {
    key: "6M",
    label: "6 Bulan",
    months: 6,
    discountPercent: 10,
    isActive: true,
    badgeText: "Hemat 10%",
  },
  {
    key: "1Y",
    label: "1 Tahun",
    months: 12,
    discountPercent: 17,
    isActive: true,
    badgeText: "Hemat 17%",
    isPopular: true,
  },
  {
    key: "2Y",
    label: "2 Tahun",
    months: 24,
    discountPercent: 25,
    isActive: true,
    badgeText: "Hemat 25%",
  },
  {
    key: "3Y",
    label: "3 Tahun",
    months: 36,
    discountPercent: 30,
    isActive: true,
    badgeText: "Hemat 30% (Best Value)",
  },
];

/**
 * Menghitung total harga dan harga efektif per bulan berdasarkan durasi & persentase diskon
 */
export function calculateDurationPrice(
  monthlyBasePrice: number,
  duration: DurationSettingItem
): {
  totalPrice: number;
  effectiveMonthlyPrice: number;
  savedAmount: number;
  discountPercent: number;
} {
  if (monthlyBasePrice <= 0 || duration.months <= 0) {
    return {
      totalPrice: 0,
      effectiveMonthlyPrice: 0,
      savedAmount: 0,
      discountPercent: 0,
    };
  }

  const rawTotal = monthlyBasePrice * duration.months;
  const discountMultiplier = Math.max(0, 1 - (duration.discountPercent || 0) / 100);
  const totalPrice = Math.round(rawTotal * discountMultiplier);
  const savedAmount = Math.max(0, rawTotal - totalPrice);
  const effectiveMonthlyPrice = Math.round(totalPrice / duration.months);

  return {
    totalPrice,
    effectiveMonthlyPrice,
    savedAmount,
    discountPercent: duration.discountPercent || 0,
  };
}
