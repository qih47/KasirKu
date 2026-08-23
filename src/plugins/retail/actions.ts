/**
 * Plugin: Retail (Fase 3)
 * Helper functions untuk perhitungan Multi-Satuan Unit (UOM) dan Harga Grosir Bertingkat
 */

export interface RetailUnit {
  unitName: string;   // misal "Dus", "Lusin", "Karton"
  multiplier: number; // misal Dus = 24 pcs
  price: number;      // harga per dus
}

export interface WholesaleTier {
  minQty: number; // misal >= 10 pcs
  price: number;  // harga per pcs menjadi Rp 8.000
}

/**
 * Menghitung harga efektif retail berdasarkan kuantitas belanja & konfigurasi atribut
 */
export function calculateRetailEffectivePrice(
  basePrice: number,
  qty: number,
  attributes?: {
    wholesaleTiers?: WholesaleTier[];
    units?: RetailUnit[];
  }
): { unitPrice: number; subtotal: number; discountApplied?: string } {
  if (!attributes) {
    return { unitPrice: basePrice, subtotal: basePrice * qty };
  }

  // 1. Cek Tiered Wholesale Price
  if (attributes.wholesaleTiers && attributes.wholesaleTiers.length > 0) {
    // Cari tier dengan minQty terbesar yang memenuhi
    const eligibleTiers = attributes.wholesaleTiers
      .filter((t: WholesaleTier) => qty >= t.minQty)
      .sort((a: WholesaleTier, b: WholesaleTier) => b.minQty - a.minQty);

    if (eligibleTiers.length > 0) {
      const bestTier = eligibleTiers[0];
      return {
        unitPrice: bestTier.price,
        subtotal: bestTier.price * qty,
        discountApplied: `Grosir (Min. ${bestTier.minQty} unit)`,
      };
    }
  }

  return { unitPrice: basePrice, subtotal: basePrice * qty };
}
