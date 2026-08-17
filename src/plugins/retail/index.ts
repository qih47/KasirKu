/**
 * Plugin: Retail & Toko Kelontong (Vertical Modul Fase 3)
 * Fitur Utama yang akan dibangun di Fase 3:
 * 1. Varian Produk (Ukuran, Warna, Rasa)
 * 2. Multi Satuan Unit (Pcs, Lusin, Dus, Karton)
 * 3. Harga Bertingkat / Grosir (Tiered Wholesale Pricing)
 */

export interface RetailProductAttributes {
  variants?: { name: string; sku: string; price: number; stock: number }[];
  units?: { unitName: string; multiplier: number; price: number }[];
}

export const RETAIL_PLUGIN_MANIFEST = {
  code: "retail",
  name: "Retail & Minimarket",
  version: "1.0.0-skeleton",
  description: "Modul toko fisik dengan varian barang, satuan grosir/karton, dan harga bertingkat.",
  features: ["Varian Produk", "Multi Satuan (Dus/Pcs)", "Harga Grosir"],
};
