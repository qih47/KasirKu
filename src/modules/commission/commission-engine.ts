/**
 * Universal Commission Calculation Engine (Decoupled & Pure Logic)
 */

export interface CalculationInput {
  item: {
    productId: string;
    qty: number;
    price: number;
    staffId?: string;
    weightKg?: number;
  };
  product: {
    type: "BARANG" | "JASA";
    price: number;
    attributes?: Record<string, any> | null;
  };
  staffUser?: {
    id: string;
    name: string;
    attributes?: Record<string, any> | null;
  } | null;
}

export interface CalculationOutput {
  commissionType: "PERCENTAGE" | "FLAT" | "WEIGHT_RATE";
  rate: number;
  amount: number;
  breakdown: string;
}

/**
 * Menghitung nilai komisi per item transaksi secara modular
 */
export function calculateItemCommission(input: CalculationInput): CalculationOutput | null {
  const { item, product, staffUser } = input;

  if (!item.staffId) return null;

  const productAttrs: Record<string, any> = product.attributes || {};
  const staffAttrs: Record<string, any> = staffUser?.attributes || {};
  const subtotal = item.qty * item.price;

  // ─── 1. Penanganan Jasa Laundry Kiloan Berdasarkan Berat (Kg) ─────────────
  if (item.weightKg && item.weightKg > 0) {
    const ratePerKg = Number(productAttrs.ironingRatePerKg || staffAttrs.ironingRatePerKg || 900);
    const amount = item.weightKg * ratePerKg;
    return {
      commissionType: "WEIGHT_RATE",
      rate: ratePerKg,
      amount: Math.round(amount),
      breakdown: `${item.weightKg} Kg x Rp ${ratePerKg.toLocaleString("id-ID")}/Kg`,
    };
  }

  // ─── 2. Penanganan Produk Fisik / Retail (Barang Take-Home) ───────────────
  if (product.type === "BARANG") {
    // Cek apakah produk memiliki insentif penjualan khusus
    if (productAttrs.productIncentiveAmount) {
      const flatPerPcs = Number(productAttrs.productIncentiveAmount);
      const amount = flatPerPcs * item.qty;
      return {
        commissionType: "FLAT",
        rate: flatPerPcs,
        amount,
        breakdown: `${item.qty} pcs x Rp ${flatPerPcs.toLocaleString("id-ID")}`,
      };
    }

    // Default rate komisi produk retail (misal 5% atau rate staff)
    const productRate = Number(staffAttrs.productCommissionRate || productAttrs.productCommissionRate || 5);
    const amount = (subtotal * productRate) / 100;
    return {
      commissionType: "PERCENTAGE",
      rate: productRate,
      amount: Math.round(amount),
      breakdown: `${productRate}% dari Rp ${subtotal.toLocaleString("id-ID")}`,
    };
  }

  // ─── 3. Penanganan Jasa / Servis / Treatment (Barber, Salon, Cuci Satuan) ───
  // Prioritas 1: Override pada produk/jasa
  if (productAttrs.commissionType && productAttrs.commissionValue) {
    const pType = productAttrs.commissionType === "FLAT" ? "FLAT" : "PERCENTAGE";
    const pRate = Number(productAttrs.commissionValue);

    if (pType === "FLAT") {
      const amount = pRate * item.qty;
      return {
        commissionType: "FLAT",
        rate: pRate,
        amount,
        breakdown: `${item.qty} x Rp ${pRate.toLocaleString("id-ID")}`,
      };
    } else {
      const amount = (subtotal * pRate) / 100;
      return {
        commissionType: "PERCENTAGE",
        rate: pRate,
        amount: Math.round(amount),
        breakdown: `${pRate}% dari Rp ${subtotal.toLocaleString("id-ID")}`,
      };
    }
  }

  // Prioritas 2: Rate default pada profil staf (Kapster/Terapis)
  const staffScheme = staffAttrs.schemeType === "FLAT" ? "FLAT" : "PERCENTAGE";
  const staffRate = Number(staffAttrs.serviceRate || (staffScheme === "FLAT" ? 15000 : 40));

  if (staffScheme === "FLAT") {
    const amount = staffRate * item.qty;
    return {
      commissionType: "FLAT",
      rate: staffRate,
      amount,
      breakdown: `Flat Rp ${staffRate.toLocaleString("id-ID")} x ${item.qty}`,
    };
  } else {
    const amount = (subtotal * staffRate) / 100;
    return {
      commissionType: "PERCENTAGE",
      rate: staffRate,
      amount: Math.round(amount),
      breakdown: `${staffRate}% dari Rp ${subtotal.toLocaleString("id-ID")}`,
    };
  }
}
