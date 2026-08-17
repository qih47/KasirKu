import { GuestPOS } from "./guest-pos";

export const metadata = {
  title: "Mesin Kasir POS (Guest Demo) | POS Universal",
  description: "Coba transaksi kasir nyata dengan scan barcode, keranjang belanja, dan cetak struk thermal.",
};

export default function GuestPOSPage() {
  return <GuestPOS />;
}
