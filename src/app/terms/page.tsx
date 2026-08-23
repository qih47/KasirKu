import React from "react";
import Link from "next/link";
import { Store, ShieldCheck, ArrowLeft, Scale, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Syarat & Ketentuan Layanan (Terms of Service) | KasirKu SaaS",
  description: "Ketentuan hukum, lisensi perangkat lunak, kebijakan pembayaran non-refundable, SLA uptime, dan retensi data platform KasirKu.",
};

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold">
            <Scale className="w-3.5 h-3.5" />
            <span>Dokumen Hukum Resmi Platform</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Syarat &amp; Ketentuan Layanan (Terms of Service)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
            Terakhir Diperbarui: <strong>22 Agustus 2026</strong>. Harap membaca seluruh ketentuan di bawah ini dengan seksama sebelum menggunakan platform KasirKu.
          </p>
        </div>

        {/* Introduction Callout */}
        <div className="p-5 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed space-y-2">
          <p className="font-extrabold text-sm flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Persetujuan Terikat Hukum
          </p>
          <p>
            Dengan mendaftar, mengakses, atau menggunakan perangkat lunak kasir berbasis cloud <strong>KasirKu (&ldquo;Platform&rdquo;)</strong>, Anda (&ldquo;Merchant / Pengguna&rdquo;) menyatakan telah membaca, memahami, dan menyetujui untuk terikat secara hukum oleh Syarat dan Ketentuan Layanan ini. Apabila Anda tidak menyetujui salah satu pasal, Anda tidak diperkenankan menggunakan Platform.
          </p>
        </div>

        {/* 8 PASAL UTAMA */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {/* PASAL 1 */}
          <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
              <span>Pemberian Hak Lisensi Penggunaan Perangkat Lunak (SaaS)</span>
            </h2>
            <p>
              1.1. KasirKu memberikan hak lisensi non-eksklusif, tidak dapat dipindahtangankan, dan terbatas kepada Merchant untuk mengakses serta mengoperasikan sistem POS Point of Sale dan Dashboard Manajemen Bisnis sesuai dengan tier paket lisensi (Basic, PRO, Enterprise) dan modul vertikal yang aktif.
            </p>
            <p>
              1.2. Seluruh hak kekayaan intelektual (IP), kode sumber (*source code*), desain antarmuka, arsitektur database, dan merek dagang KasirKu tetap merupakan hak milik mutlak penyedia platform KasirKu.
            </p>
          </section>

          {/* PASAL 2 */}
          <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
              <span>Kebijakan Pembayaran Langganan &amp; Pembatalan (No-Refund Policy)</span>
            </h2>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
              <strong className="font-extrabold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                PENTING: Kebijakan Tidak Ada Pengembalian Dana (Non-Refundable)
              </strong>
              <p>
                Seluruh biaya langganan lisensi paket, modul plugin vertikal, dan tema kustom yang telah dibayarkan melalui Payment Gateway (QRIS, Virtual Account, Transfer Bank) bersifat <strong>FINAL dan NON-REFUNDABLE (TIDAK DAPAT DIUANGKAN KEMBALI)</strong> dalam keadaan apa pun.
              </p>
            </div>
            <p>
              2.1. Penurunan paket (*downgrade*) lisensi di tengah periode aktif akan membatalkan sisa hari paket berjalan tanpa adanya pengembalian dana prorasi atau kompensasi uang tunai.
            </p>
            <p>
              2.2. Keterlambatan pembayaran tagihan perpanjangan setelah masa aktif berakhir akan menyebabkan pembekuan transaksi kasir POS secara otomatis.
            </p>
          </section>

          {/* PASAL 3 */}
          <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
              <span>Kedaulatan &amp; Kepemilikan Data Bisnis Merchant (UU PDP)</span>
            </h2>
            <p>
              3.1. <strong>Kepemilikan Penuh Merchant</strong>: Seluruh data katalog produk, resep rahasia, data histori transaksi, daftar nomor telepon pelanggan CRM, serta catatan omzet penjualan adalah <strong>milik eksklusif Merchant</strong>.
            </p>
            <p>
              3.2. <strong>Kepatuhan Kerahasiaan</strong>: KasirKu berkomitmen tidak akan menjual, menyewakan, atau mendistribusikan data bisnis maupun data pribadi pelanggan Merchant kepada pihak ketiga mana pun tanpa persetujuan tertulis, sesuai amanat <strong>UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong>.
            </p>
            <p>
              3.3. Merchant berhak melakukan ekspor data transaksi dan data pelanggan kapan saja melalui dashboard manajemen.
            </p>
          </section>

          {/* PASAL 4 */}
          <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
              <span>Batasan Tanggung Jawab Operasional (Limitation of Liability)</span>
            </h2>
            <p>
              4.1. KasirKu bertindak murni sebagai penyedia perangkat lunak (*software-as-a-service provider*). KasirKu tidak bertanggung jawab atas:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Sengketa transaksi jual-beli antara Merchant dengan pelanggan akhir (konsumen toko).</li>
              <li>Kekeliruan input manual kuantitas barang, diskon, atau penetapan harga oleh staf kasir Merchant.</li>
              <li>Selisih fisik kas di laci kasir (*cash discrepancy*) akibat kelalaian operasional internal Merchant.</li>
              <li>Gangguan jaringan internet pihak ketiga, listrik padam di lokasi toko, atau kegagalan perangkat keras printer thermal merchant.</li>
            </ul>
          </section>

          {/* PASAL 5 */}
          <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">5</span>
              <span>Jaminan Ketersediaan Layanan (Service Level Agreement - SLA)</span>
            </h2>
            <p>
              5.1. KasirKu menargetkan ketersediaan sistem (*server uptime*) sebesar <strong>99.5%</strong> setiap bulannya, di luar pemeliharaan sistem terencana (*scheduled maintenance*).
            </p>
            <p>
              5.2. Pemeliharaan sistem terjadwal akan diumumkan terlebih dahulu melalui broadcast sistem dan diutamakan pada jam non-operasional (Pukul 02:00 - 04:00 WIB).
            </p>
          </section>

          {/* PASAL 6 */}
          <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">6</span>
              <span>Kebijakan Masa Tenggang &amp; Retensi Data Kedaluwarsa (6 Bulan)</span>
            </h2>
            <p>
              6.1. <strong>Masa Tenggang (Grace Period 3 Hari)</strong>: Apabila masa aktif habis, Merchant diberikan tenggang waktu 3 hari dengan status peringatan sebelum akses pembuatan transaksi POS dikunci.
            </p>
            <p>
              6.2. <strong>Retensi Data Selama 6 Bulan</strong>: Jika akun berada dalam status tidak aktif / kedaluwarsa, KasirKu menjamin seluruh data transaksi, produk, dan laporan keuangan Merchant tetap <strong>tersimpan aman selama 6 (enam) bulan</strong> sejak tanggal kedaluwarsa.
            </p>
            <p>
              6.3. Setelah lewat dari 6 bulan berturut-turut tanpa perpanjangan, KasirKu berhak melakukan pengarsipan dingin (*cold archive*) atau penghapusan data secara permanen demi efisiensi ruang server.
            </p>
          </section>

          {/* PASAL 7 */}
          <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">7</span>
              <span>Larangan Penggunaan Ilegal (Acceptable Use Policy)</span>
            </h2>
            <p>
              Merchant dilarang keras memanfaatkan platform KasirKu untuk kegiatan yang melanggar hukum Republik Indonesia, termasuk namun tidak terbatas pada: transaksi barang terlarang, narkotika, pencucian uang (*money laundering*), perjudian, atau tindakan penipuan konsumen. KasirKu berhak menonaktifkan akun yang terbukti melanggar ketentuan ini secara sepihak tanpa ganti rugi.
            </p>
          </section>

          {/* PASAL 8 */}
          <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">8</span>
              <span>Hukum yang Berlaku &amp; Penyelesaian Sengketa</span>
            </h2>
            <p>
              Syarat dan Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Negara Republik Indonesia. Segala perselisihan yang timbul akan diselesaikan secara musyawarah untuk mufakat terlebih dahulu sebelum diajukan ke yurisdiksi pengadilan negeri setempat.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} KasirKu SaaS. Seluruh hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-4 font-bold">
            <Link href="/privacy" className="hover:text-indigo-600 underline">
              Kebijakan Privasi (Privacy Policy)
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
