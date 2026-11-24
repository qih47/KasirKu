export type BusinessVerticalType = "CAFE" | "BARBERSHOP" | "LAUNDRY" | "RETAIL";

/**
 * Resolves a product's target business vertical reliably using:
 * 1. Explicit `attributes.verticalType`
 * 2. Specialized vertical attributes (recipe, barber duration, laundry unit)
 * 3. Comprehensive category dictionary matching
 * 4. Product type fallback
 */
export function resolveProductVertical(p: {
  category?: string | null;
  type?: string | null;
  attributes?: Record<string, any> | null;
}): BusinessVerticalType {
  if (!p) return "RETAIL";

  const attrs = (p.attributes as Record<string, any>) || {};

  // 1. Explicit vertical tag
  const explicit = attrs.verticalType?.toString().toUpperCase();
  if (
    explicit === "CAFE" ||
    explicit === "BARBERSHOP" ||
    explicit === "LAUNDRY" ||
    explicit === "RETAIL"
  ) {
    return explicit as BusinessVerticalType;
  }

  // 2. Explicit Barbershop attributes
  if (
    attrs.durationMinutes !== undefined ||
    attrs.stylistRate !== undefined ||
    attrs.barberCommission !== undefined
  ) {
    return "BARBERSHOP";
  }

  // 3. Explicit Laundry attributes
  if (
    attrs.serviceUnit !== undefined ||
    attrs.estimateTime !== undefined ||
    attrs.fragrance !== undefined ||
    attrs.laundryRack !== undefined
  ) {
    return "LAUNDRY";
  }

  // 4. Explicit Cafe attributes (Recipe / BOM, dining units)
  if (
    attrs.recipe !== undefined ||
    (Array.isArray(attrs.recipe) && attrs.recipe.length > 0)
  ) {
    return "CAFE";
  }

  const unit = attrs.unit?.toString().toLowerCase();
  if (
    ["porsi", "cup", "plate", "glass", "gelas", "piring", "mangkok", "bowl"].includes(
      unit || ""
    )
  ) {
    return "CAFE";
  }

  const cat = (p.category || "").toLowerCase().trim();

  // 5. Category Keyword Match for Cafe & F&B
  const cafeKeywords = [
    "makan",
    "food",
    "meal",
    "minum",
    "drink",
    "beverage",
    "kopi",
    "coffee",
    "tea",
    "teh",
    "snack",
    "pastry",
    "dessert",
    "main course",
    "appetizer",
    "bites",
    "toast",
    "roti",
    "mie",
    "nasi",
    "espresso",
    "latte",
    "signature",
    "mocktail",
    "juice",
    "jus",
    "dapur",
    "kitchen",
    "cafe",
    "kafe",
    "resto",
    "bakery",
  ];
  if (cafeKeywords.some((kw) => cat.includes(kw))) {
    return "CAFE";
  }

  // 6. Category Keyword Match for Laundry
  const laundryKeywords = [
    "laundry",
    "cuci kiloan",
    "cuci satuan",
    "dry clean",
    "setrika",
    "ironing",
    "bed cover",
    "karpet",
    "kiloan",
    "satuan",
    "cucian",
  ];
  if (laundryKeywords.some((kw) => cat.includes(kw))) {
    return "LAUNDRY";
  }

  // 7. Category Keyword Match for Barbershop
  const barberKeywords = [
    "pangkas",
    "barber",
    "haircut",
    "shaving",
    "cukur",
    "styling",
    "coloring",
    "creambath",
    "massage",
    "hair",
    "pomade",
    "wax",
    "hair tonic",
    "beard",
    "salon",
    "rambut",
    "gentleman",
  ];
  if (barberKeywords.some((kw) => cat.includes(kw))) {
    return "BARBERSHOP";
  }

  // 8. Tipe JASA fallback (jika bukan laundry atau cafe)
  if (p.type === "JASA") {
    return "BARBERSHOP";
  }

  return "RETAIL";
}

