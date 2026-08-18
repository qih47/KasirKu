import { z } from "zod";
import { BusinessVertical } from "./receipt";

// ============================================================
// 1. PLUGIN MANIFEST & METADATA
// ============================================================

export type PluginType = "THEME" | "POS_LAYOUT" | "RECEIPT_PRESET" | "PLUGIN";

export const PluginManifestSchema = z.object({
  id: z.string().min(3).regex(/^[a-z0-9-_]+$/, "ID harus lowercase, angka, dash, atau underscore"),
  name: z.string().min(2, "Nama plugin minimal 2 karakter"),
  type: z.enum(["THEME", "POS_LAYOUT", "RECEIPT_PRESET", "PLUGIN"]),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Versi harus format semver (contoh: 1.0.0)"),
  author: z.string().default("Qassa Official"),
  description: z.string().optional(),
  vertical: z.enum(["GENERAL", "CAFE", "BARBERSHOP", "RETAIL", "LAUNDRY", "UNIVERSAL"]).default("GENERAL"),
  compatibility: z.string().default(">=1.0.0"),
  previewUrls: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  priceMonthly: z.number().nonnegative().default(0),
  priceAnnual: z.number().nonnegative().default(0),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;

// ============================================================
// 2. DESIGN TOKENS (Styling, Colors, Fonts, Borders)
// ============================================================

export const ColorTokensSchema = z.object({
  primary: z.string(), // Hex / HSL / RGB
  primaryForeground: z.string().default("#ffffff"),
  secondary: z.string().optional(),
  secondaryForeground: z.string().optional(),
  background: z.string().default("#090d16"), // Main bg
  backgroundMuted: z.string().optional(),
  card: z.string().default("#111a2e"), // Card / container bg
  cardForeground: z.string().optional(),
  border: z.string().default("#1e293b"), // Border color
  sidebar: z.string().optional(), // Sidebar bg
  sidebarForeground: z.string().optional(),
  accent: z.string().optional(), // Accent / Highlight
  success: z.string().default("#10b981"),
  warning: z.string().default("#f59e0b"),
  danger: z.string().default("#ef4444"),
});

export const TypographyTokensSchema = z.object({
  fontFamily: z.string().default("Plus Jakarta Sans, sans-serif"),
  fontHeading: z.string().optional(),
  fontMono: z.string().optional().default("ui-monospace, monospace"),
  baseFontSize: z.string().optional().default("14px"),
  headingWeight: z.enum(["normal", "medium", "semibold", "bold", "extrabold"]).optional().default("bold"),
});

export const EffectTokensSchema = z.object({
  borderRadius: z.string().optional().default("12px"),
  cardBorderRadius: z.string().optional().default("14px"),
  buttonBorderRadius: z.string().optional().default("10px"),
  glassmorphism: z.boolean().optional().default(false),
  glassOpacity: z.string().optional(),
  shadowScale: z.enum(["none", "sm", "md", "lg", "glow"]).optional().default("md"),
  glowColor: z.string().optional(),
});


export const ThemeTokensSchema = z.object({
  mode: z.enum(["dark", "light", "auto"]).default("dark"),
  colors: ColorTokensSchema,
  typography: TypographyTokensSchema.default({}),
  effects: EffectTokensSchema.default({}),
});

export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;

// ============================================================
// 3. POS LAYOUT SLOTS & BLUEPRINT
// ============================================================

export type PosWidgetId =
  | "pos.search_bar"
  | "pos.category_pills"
  | "pos.product_grid"
  | "pos.cart_sidebar"
  | "pos.quick_actions"
  | "pos.customer_selector"
  | "pos.table_selector"
  | "pos.capster_selector"
  | "pos.weighing_input"
  | "pos.numpad_changer"
  | "pos.barcode_scanner_active";

export const PosSlotItemSchema = z.object({
  widget: z.string(), // PosWidgetId
  order: z.number().int().optional().default(1),
  colSpan: z.number().int().min(1).max(12).optional(),
  rowSpan: z.number().int().min(1).max(12).optional(),
  hidden: z.boolean().optional().default(false),
  variant: z.string().optional(), // e.g. 'compact', 'expanded', 'tiles', 'list'
  customProps: z.record(z.any()).optional(),
});

export const PosLayoutBlueprintSchema = z.object({
  cartDock: z.enum(["right", "left", "bottom", "floating"]).optional().default("right"),
  cartWidth: z.string().optional().default("380px"), // e.g. "340px", "400px", "30%"
  productGridColumns: z.number().int().min(2).max(8).optional().default(4),
  productCardStyle: z.enum(["grid_card", "compact_row", "large_photo", "pill_list"]).optional().default("grid_card"),
  showCategoriesAs: z.enum(["horizontal_pills", "sidebar_left", "vertical_sidebar", "dropdown", "tabs"]).optional().default("horizontal_pills"),
  slots: z.array(PosSlotItemSchema).optional().default([]),
});


export interface PosSlotItem {
  widget: string;
  order?: number;
  colSpan?: number;
  rowSpan?: number;
  hidden?: boolean;
  variant?: string;
  customProps?: Record<string, any>;
}

export interface PosLayoutBlueprint {
  cartDock?: "right" | "left" | "bottom" | "floating";
  cartWidth?: string;
  productGridColumns?: number;
  productCardStyle?: "grid_card" | "compact_row" | "large_photo" | "pill_list";
  showCategoriesAs?: "horizontal_pills" | "sidebar_left" | "vertical_sidebar" | "dropdown" | "tabs";
  slots?: PosSlotItem[];
}


// ============================================================
// 4. DASHBOARD LAYOUT SLOTS & BLUEPRINT
// ============================================================

export type DashboardWidgetId =
  | "dashboard.kpi_revenue"
  | "dashboard.kpi_transactions"
  | "dashboard.kpi_average_order"
  | "dashboard.kpi_active_shift"
  | "dashboard.sales_chart"
  | "dashboard.recent_transactions"
  | "dashboard.top_products"
  | "dashboard.quick_shortcuts"
  | "dashboard.outlet_switch";

export const DashboardSlotItemSchema = z.object({
  widget: z.string(), // DashboardWidgetId
  order: z.number().int().optional().default(1),
  colSpan: z.number().int().min(1).max(12).optional().default(12),
  rowSpan: z.number().int().min(1).max(12).optional(),
  hidden: z.boolean().optional().default(false),
  variant: z.string().optional(),
});

export const DashboardLayoutBlueprintSchema = z.object({
  kpiColumns: z.number().int().min(1).max(6).optional().default(4),
  gap: z.string().optional().default("1.5rem"),
  slots: z.array(DashboardSlotItemSchema).optional().default([]),
});

export interface DashboardSlotItem {
  widget: string;
  order?: number;
  colSpan?: number;
  rowSpan?: number;
  hidden?: boolean;
  variant?: string;
}

export interface DashboardLayoutBlueprint {
  kpiColumns?: number;
  gap?: string;
  slots?: DashboardSlotItem[];
}


// ============================================================
// 5. RECEIPT PRESET & BLOCKS
// ============================================================

export type ReceiptBlockType =
  | "HEADER_LOGO"
  | "STORE_META"
  | "DIVIDER"
  | "TRANSACTION_META"
  | "QUEUE_NUMBER"
  | "TABLE_META"
  | "ITEMS_TABLE"
  | "TOTAL_SUMMARY"
  | "PAYMENT_DETAILS"
  | "QRIS_CODE"
  | "COUPON_PROMO"
  | "WIFI_INFO"
  | "FOOTER_NOTES"
  | "POWERED_BY";

export const ReceiptBlockSchema = z.object({
  id: z.string().optional(),
  type: z.enum([
    "HEADER_LOGO",
    "STORE_META",
    "DIVIDER",
    "TRANSACTION_META",
    "QUEUE_NUMBER",
    "TABLE_META",
    "ITEMS_TABLE",
    "TOTAL_SUMMARY",
    "PAYMENT_DETAILS",
    "QRIS_CODE",
    "COUPON_PROMO",
    "WIFI_INFO",
    "FOOTER_NOTES",
    "POWERED_BY",
  ]),
  align: z.enum(["left", "center", "right"]).default("center"),
  hidden: z.boolean().default(false),
  style: z.record(z.any()).optional(), // custom styles for block
  props: z.record(z.any()).optional(), // block-specific parameters
});

export interface ReceiptBlock {
  id?: string;
  type: ReceiptBlockType;
  align?: "left" | "center" | "right";
  hidden?: boolean;
  style?: Record<string, any>;
  props?: Record<string, any>;
}

export const ReceiptPresetBlueprintSchema = z.object({
  paperWidth: z.enum(["58mm", "80mm"]).optional().default("80mm"),
  fontFamily: z.enum(["monospace", "sans-serif", "serif"]).optional().default("monospace"),
  fontSizeScale: z.enum(["compact", "normal", "spacious"]).optional().default("normal"),
  dividerStyle: z.enum(["dashed", "double", "solid", "dotted", "minimal"]).optional().default("dashed"),
  blocks: z.array(ReceiptBlockSchema).optional().default([]),
});

export interface ReceiptPresetBlueprint {
  paperWidth?: "58mm" | "80mm";
  fontFamily?: "monospace" | "sans-serif" | "serif";
  fontSizeScale?: "compact" | "normal" | "spacious";
  dividerStyle?: "dashed" | "double" | "solid" | "dotted" | "minimal";
  blocks?: ReceiptBlock[];
}


// ============================================================
// 6. MASTER PLUGIN PACKAGE (Root Export / Import File)
// ============================================================

export const PluginPackageSchema = z.object({
  manifest: PluginManifestSchema,
  tokens: ThemeTokensSchema.optional(),
  layouts: z
    .object({
      pos: PosLayoutBlueprintSchema.optional(),
      dashboard: DashboardLayoutBlueprintSchema.optional(),
    })
    .optional(),
  receipt: ReceiptPresetBlueprintSchema.optional(),
});

export interface PluginPackage {
  manifest: PluginManifest;
  tokens?: ThemeTokens;
  layouts?: {
    pos?: PosLayoutBlueprint;
    dashboard?: DashboardLayoutBlueprint;
  };
  receipt?: ReceiptPresetBlueprint;
}


// Helper for validating raw JSON input from Super Admin / Catalog
export function validatePluginPackage(data: unknown): {
  success: boolean;
  package?: PluginPackage;
  error?: string;
  fieldErrors?: Record<string, string[]>;
} {
  const result = PluginPackageSchema.safeParse(data);
  if (!result.success) {
    const flattened = result.error.flatten();
    return {
      success: false,
      error: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      fieldErrors: flattened.fieldErrors,
    };
  }
  return {
    success: true,
    package: result.data,
  };
}
