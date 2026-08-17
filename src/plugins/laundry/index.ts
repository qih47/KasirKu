/**
 * Plugin: Laundry Kiloan & Satuan (Vertical Modul Fase 3)
 * Fitur Utama yang akan dibangun di Fase 3:
 * 1. Layanan Kiloan (Penimbangan Berat Desimal) & Satuan
 * 2. Pelacakan Status Cucian (Diterima -> Dicuci -> Dikeringkan -> Disetrika -> Siap Ambil -> Selesai)
 * 3. Pilihan Pewangi / Parfum & Catatan Khusus
 */

export interface LaundryProductAttributes {
  isWeightBased?: boolean;
  minWeightKg?: number;
  fragranceOptions?: string[];
}

export const LAUNDRY_PLUGIN_MANIFEST = {
  code: "laundry",
  name: "Laundry Kiloan & Satuan",
  version: "1.0.0-skeleton",
  description: "Modul laundry dengan timbangan berat, tahapan status pengerjaan, dan pilihan parfum.",
  features: ["Laundry Kiloan/Satuan", "Tracking 5 Status Cucian", "Pilihan Parfum"],
};
