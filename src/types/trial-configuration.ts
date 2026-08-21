// ============================================================
// PLATFORM TRIAL CONFIGURATION TYPE & UTILITIES
// Superadmin dapat mengatur durasi masa trial (hari / bulan)
// ============================================================

import { addDays, addMonths } from "date-fns";

export type TrialDurationUnit = "DAYS" | "MONTHS";

export interface TrialConfiguration {
  durationValue: number; // Misal: 7, 14, 30, 1, 2, 3
  durationUnit: TrialDurationUnit; // "DAYS" | "MONTHS"
  isEnabled: boolean; // Apakah masa trial gratis diaktifkan untuk pendaftaran baru
  customBadgeText?: string; // Optional custom tagline
}

export const DEFAULT_TRIAL_CONFIGURATION: TrialConfiguration = {
  durationValue: 30,
  durationUnit: "DAYS",
  isEnabled: true,
  customBadgeText: "",
};

/**
 * Menghitung estimasi total hari dari konfigurasi trial
 */
export function getTrialDurationInDays(config?: TrialConfiguration | null): number {
  if (!config) return 30;
  if (config.durationUnit === "MONTHS") {
    return Math.max(1, config.durationValue) * 30;
  }
  return Math.max(1, config.durationValue);
}

/**
 * Menghitung tanggal selesai masa trial berdasarkan waktu mulai
 */
export function calculateTrialEndDate(
  config?: TrialConfiguration | null,
  startDate: Date = new Date()
): Date {
  if (!config || !config.isEnabled) {
    return startDate;
  }
  const val = Math.max(1, Number(config.durationValue) || 30);
  if (config.durationUnit === "MONTHS") {
    return addMonths(startDate, val);
  }
  return addDays(startDate, val);
}

/**
 * Mendapatkan label teks durasi trial (misal: "30 Hari", "1 Bulan", "14 Days", "3 Months")
 */
export function getTrialDurationLabel(
  config?: TrialConfiguration | null,
  locale: string = "id"
): string {
  if (!config || !config.isEnabled) {
    return locale === "en" ? "0 Days" : "0 Hari";
  }
  const val = Math.max(1, Number(config.durationValue) || 30);
  if (config.durationUnit === "MONTHS") {
    if (locale === "en") {
      return `${val} ${val > 1 ? "Months" : "Month"}`;
    }
    return `${val} Bulan`;
  }
  if (locale === "en") {
    return `${val} ${val > 1 ? "Days" : "Day"}`;
  }
  return `${val} Hari`;
}

/**
 * Mendapatkan label CTA tombol utama (misal: "Coba Gratis 30 Hari", "Start 1-Month Free Trial")
 */
export function getTrialCtaLabel(
  config?: TrialConfiguration | null,
  locale: string = "id"
): string {
  const durationText = getTrialDurationLabel(config, locale);
  if (locale === "en") {
    return `Try Free for ${durationText}`;
  }
  return `Coba Gratis ${durationText}`;
}

/**
 * Mendapatkan label Hero CTA (misal: "Mulai Uji Coba Gratis 30 Hari", "Start 30-Day Free Trial")
 */
export function getTrialHeroCtaLabel(
  config?: TrialConfiguration | null,
  locale: string = "id"
): string {
  const durationText = getTrialDurationLabel(config, locale);
  if (locale === "en") {
    return `Start ${durationText} Free Trial`;
  }
  return `Mulai Uji Coba Gratis ${durationText}`;
}
