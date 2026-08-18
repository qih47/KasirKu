import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qassa Cloud POS - Sistem Kasir Cerdas Multi-Vertikal",
  description:
    "Qassa adalah platform kasir cloud modern untuk Cafe, Barbershop, Retail, dan Laundry. Multi-cabang, laporan real-time, cetak struk thermal. Coba gratis 30 hari.",
  icons: {
    icon: "/smLogo.png",
    apple: "/smLogo.png",
    shortcut: "/smLogo.png",
  },
  openGraph: {
    title: "Qassa Cloud POS - Sistem Kasir Cerdas Multi-Vertikal",
    description:
      "Platform kasir cloud untuk Cafe, Barbershop, Retail & Laundry. Coba gratis 30 hari tanpa kartu kredit.",
    images: [{ url: "/smLogo.png" }],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="antialiased selection:bg-indigo-500 selection:text-white"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
