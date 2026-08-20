export interface DayOperatingHours {
  isOpen: boolean;       // Status Bisnis Buka / Libur
  openTime: string;      // Format "HH:mm" e.g. "08:00"
  closeTime: string;     // Format "HH:mm" e.g. "22:00"
  is24Hours: boolean;    // True jika buka 24 jam nonstop
}

export type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface WeeklyOperatingSchedule {
  monday: DayOperatingHours;
  tuesday: DayOperatingHours;
  wednesday: DayOperatingHours;
  thursday: DayOperatingHours;
  friday: DayOperatingHours;
  saturday: DayOperatingHours;
  sunday: DayOperatingHours;
}

export const DAY_LABELS: Record<DayKey, string> = {
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
  sunday: "Minggu",
};

export const DEFAULT_DAY_HOURS: DayOperatingHours = {
  isOpen: true,
  openTime: "08:00",
  closeTime: "22:00",
  is24Hours: false,
};

export const DEFAULT_WEEKLY_SCHEDULE: WeeklyOperatingSchedule = {
  monday: { isOpen: true, openTime: "08:00", closeTime: "22:00", is24Hours: false },
  tuesday: { isOpen: true, openTime: "08:00", closeTime: "22:00", is24Hours: false },
  wednesday: { isOpen: true, openTime: "08:00", closeTime: "22:00", is24Hours: false },
  thursday: { isOpen: true, openTime: "08:00", closeTime: "22:00", is24Hours: false },
  friday: { isOpen: true, openTime: "08:00", closeTime: "23:00", is24Hours: false },
  saturday: { isOpen: true, openTime: "08:00", closeTime: "23:30", is24Hours: false },
  sunday: { isOpen: true, openTime: "09:00", closeTime: "21:00", is24Hours: false },
};

/**
 * Mendapatkan rentang jam operasional untuk analitik jam ramai berdasarkan hari dan jadwal outlet
 */
export function getOperatingHoursRange(schedule?: WeeklyOperatingSchedule | null): {
  startHour: number;
  endHour: number;
  is24Hours: boolean;
} {
  if (!schedule) {
    return { startHour: 8, endHour: 22, is24Hours: false };
  }

  // Cari jam buka paling awal dan jam tutup paling akhir dari seluruh hari aktif
  let minHour = 8;
  let maxHour = 22;
  let has24Hours = false;

  const days: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  days.forEach((day) => {
    const config = schedule[day];
    if (config && config.isOpen) {
      if (config.is24Hours) {
        has24Hours = true;
      } else {
        const [openH] = (config.openTime || "08:00").split(":").map(Number);
        const [closeH] = (config.closeTime || "22:00").split(":").map(Number);

        if (!isNaN(openH)) minHour = Math.min(minHour, openH);
        if (!isNaN(closeH)) {
          // Jika tutup lewat tengah malam (misal 02:00)
          if (closeH < openH) {
            maxHour = 23;
            minHour = Math.min(minHour, closeH);
          } else {
            maxHour = Math.max(maxHour, closeH);
          }
        }
      }
    }
  });

  if (has24Hours) {
    return { startHour: 0, endHour: 23, is24Hours: true };
  }

  return {
    startHour: Math.max(0, minHour),
    endHour: Math.min(23, maxHour),
    is24Hours: false,
  };
}
