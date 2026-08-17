import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "POS Universal - Multi-Vertical POS SaaS Platform",
  description:
    "Aplikasi kasir multi-vertical cerdas yang dapat dikonfigurasi untuk Barbershop, F&B/Cafe, Retail, dan Laundry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
