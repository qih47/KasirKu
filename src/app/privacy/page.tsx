import React from "react";
import Link from "next/link";
import { Store, Shield, ArrowLeft, Lock, Database, Eye, RefreshCw, FileCheck } from "lucide-react";

export const metadata = {
  title: "Kebijakan Privasi & Perlindungan Data (Privacy Policy) | KasirKu SaaS",
  description: "Kebijakan perlindungan data pribadi dan data bisnis merchant sesuai amanat UU No. 27 Tahun 2022 (UU PDP).",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-black text-base text-slate-950 dark:text-white">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Store className="w-5 h-5" />
            </div>
            <span>KasirKu<span className="text-indigo-600">.</span></span>
          </Link>

          <Link
            href="/register"
            className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Pendaftaran</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        {/* Title Header */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold">
            <Shield className="w-3.5 h-3.5" />
            <span>Kepatuhan UU PDP No. 27 Tahun 2022</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Kebijakan Privasi &amp; Perlindungan Data
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
            Komitmen transparansi penuh mengenai bagaimana kami melindungi data bisnis Merchant dan data pribadi pelanggan toko Anda.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {/* SECTION 1 */}
          <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>1. Informasi yang Kami Kumpulkan</span>
            </h2>
            <p>
              Untuk menyediakan layanan sistem kasir terpadu yang handal, kami mengumpulkan kategori data berikut:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
              <li><strong>Data Akun Merchant</strong>: Nama pemilik, nama usaha/toko, alamat outlet, alamat email, dan nomor WhatsApp untuk keperluan autentikasi dan notifikasi sistem.</li>
              <li><strong>Data Operasional Toko</strong>: Daftar katalog produk, harga pokok penjualan (HPP), resep menu kafe, kuantitas stok barang di outlet, riwayat pesanan meja, dan laporan shift kasir.</li>
              <li><strong>Data Pelanggan Toko (CRM)</strong>: Nama dan nomor telepon pembeli yang didaftarkan secara sukarela oleh kasir saat transaksi atau saat self-order via QR meja.</li>
            </ul>
          </section>

          {/* SECTION 2 */}
          <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              <span>2. Kedaulatan Data &amp; Larangan Penjualan Data</span>
            </h2>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-950 dark:text-emerald-200 text-xs space-y-1.5">
              <strong className="font-extrabold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <FileCheck className="w-4 h-4" />
                Prinsip Kedaulatan Penuh Merchant
              </strong>
              <p>
                Seluruh data transaksi dan data pelanggan yang tersimpan pada akun Anda adalah <strong>milik penuh Merchant</strong>. KasirKu <strong>TIDAK PERNAH dan TIDAK AKAN PERNAH</strong> menjual, meminjamkan, atau memperdagangkan data transaksi maupun nomor kontak pelanggan Anda kepada pihak ketiga, broker data, atau pengiklan mana pun.
              </p>
            </div>
            <p>
              Kami hanya memproses data Anda untuk kebutuhan menjalankan fungsi aplikasi kasir POS, sinkronisasi pesanan dapur, pelaporan laba/rugi, dan pencatatan komisi staf.
            </p>
          </section>

          {/* SECTION 3 */}
          <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>3. Keamanan Data &amp; Enkripsi</span>
            </h2>
            <p>
              Kami menerapkan standar keamanan industri modern guna melindungi data dari akses tanpa izin:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
              <li><strong>Enkripsi Kata Sandi</strong>: Seluruh kata sandi pengguna dienkripsi menggunakan algoritma *hashing* satu arah (*Bcrypt*) dengan garam acak (*salt*).</li>
              <li><strong>Isolasi Multi-Tenant</strong>: Basis data menerapkan pemisahan tenant ketat (`tenantId` level isolation), memastikan data antar-toko tidak dapat saling intip.</li>
              <li><strong>Protokol HTTPS / TLS</strong>: Seluruh lalu lintas data antara browser/HP kasir dengan server terlindungi oleh enkripsi SSL/TLS 256-bit.</li>
            </ul>
          </section>

          {/* SECTION 4 */}
          <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
              <span>4. Hak Portabilitas &amp; Penghapusan Data</span>
            </h2>
            <p>
              Sesuai amanat UU PDP, Merchant memiliki hak penuh untuk:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>Mengunduh dan mengekspor seluruh riwayat penjualan serta data pelanggan ke dalam format spreadsheet (.xlsx / .csv).</li>
              <li>Mengubah, memperbarui, atau menghapus data karyawan kasir dan data outlet kapan saja.</li>
              <li>Mengajukan permohonan penutupan akun permanen dan pembersihan data melalui tim dukungan resmi KasirKu.</li>
            </ul>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} KasirKu SaaS. Seluruh hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-4 font-bold">
            <Link href="/terms" className="hover:text-indigo-600 underline">
              Syarat &amp; Ketentuan (Terms of Service)
            </Link>
            <Link href="/" className="hover:text-indigo-600">
              Beranda
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
