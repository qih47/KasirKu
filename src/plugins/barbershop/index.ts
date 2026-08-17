/**
 * Plugin: Barbershop & Salon (Vertical Modul Fase 2)
 * Fitur Utama yang akan dibangun di Fase 2:
 * 1. Manajemen Antrian / Queue & Kursi Layanan
 * 2. Perhitungan Komisi Barber / Stylist (Persentase / Flat per item)
 * 3. Durasi Layanan & Booking Jadwal Pelanggan
 */

export interface BarbershopProductAttributes {
  durationMinutes?: number;
  commissionType?: "PERCENTAGE" | "FLAT";
  commissionValue?: number;
}

export const BARBERSHOP_PLUGIN_MANIFEST = {
  code: "barbershop",
  name: "Barbershop & Salon",
  version: "1.0.0-skeleton",
  description: "Modul khusus pangkas rambut, salon, antrian pelanggan, dan bagi hasil komisi kapster.",
  features: ["Antrian Kursi", "Bagi Hasil Komisi Barber", "Durasi Treatment"],
};
