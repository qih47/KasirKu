/**
 * Plugin: Cafe & F&B (Vertical Modul Fase 3)
 * Fitur Utama yang akan dibangun di Fase 3:
 * 1. Manajemen Meja & Denah Meja (Table Map)
 * 2. Tiket Dapur / Bar (Kitchen Order Ticket - KOT)
 * 3. Split Bill & Open Bill / Dine-in vs Takeaway
 */

export interface CafeProductAttributes {
  isKitchenTicket?: boolean;
  modifiers?: { name: string; options: { label: string; extraPrice: number }[] }[];
}

export const CAFE_PLUGIN_MANIFEST = {
  code: "cafe",
  name: "Cafe & Resto (F&B)",
  version: "1.0.0-skeleton",
  description: "Modul kuliner, nomor meja, open bill / split bill, dan cetak tiket dapur/bar.",
  features: ["Nomor Meja", "Tiket Dapur (KOT)", "Split Bill", "Modifier Menu"],
};
