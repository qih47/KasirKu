# Panduan Kerja & Protokol Agen (AGENTS.md)

Dokumen ini mendefinisikan aturan dan protokol standar operasional (SOP) bagi Agen AI saat berinteraksi dan mengelola proyek **Qassa Cloud POS (projectKasir)**.

---

## PROTOKOL KHUSUS: AUDIT SISTEM, BUGS, BOTTLENECK, & REKOMENDASI ALUR

Ketika Pengguna (USER) meminta untuk melakukan **audit sistem**, **mencari bugs**, **menganalisis bottleneck**, **memeriksa ketidaksesuaian/kesalahan alur**, atau **meminta rekomendasi alur dan fitur baru**, Agen **WAJIB** mengikuti alur kerja 6 langkah baku berikut secara ketat dan menyeluruh:

### 1. Pindai Seluruh Sistem & Petakan Alur Fungsi (Holistic Scanning)
- Lakukan peninjauan menyeluruh terhadap arsitektur dan alur fungsional sistem yang menjadi konteks permintaan (Database Schema Prisma, Server Actions, Middleware/Auth, Payment/API Webhooks, hingga Client Components & UI).
- Petakan alur data dan logika bisnis bagaimana fitur tersebut semestinya beroperasi dari awal hingga akhir (*ideal state*).

### 2. Kunci Fokus pada Bug Pertama (Focus Lock)
- Segera setelah menemukan **bug, diskoneksi, atau celah logika pertama**, **HENTIKAN** pencarian isu-isu baru yang terpisah atau tidak terkait secara acak.
- Jangan melompat-lompat ke area lain sebelum menyelidiki tuntas seluruh benang merah yang terikat dengan temuan pertama ini.

### 3. Eksplorasi Mendalam Hulu ke Hilir & Audit Sinkronisasi Fungsi Sistem (Upstream-to-Downstream & Function Synchronization)
Gunakan bug pertama sebagai titik jangkar untuk menelusuri seluruh rantai ekosistem terkait secara mendalam dan menyeluruh:

1. **Hulu (Upstream - Sumber & Validasi Data)**:
   - Sumber input (client UI, form kasir, scan QR publik, webhook external).
   - Validasi skema, sanitasi input, validasi harga server-side, otentikasi peran & hak akses.
2. **Tengah (Core Processing - Logika Bisnis & Transaksi)**:
   - Logika bisnis di server actions, transaksi database atomik (`prisma.$transaction`), formula kalkulasi (harga/kuota/prorata/komisi/stok).
3. **Hilir (Downstream - Efek Samping & Integrasi)**:
   - Efek samping data ke entitas lain: mutasi kas, mutasi stok/BOM, loyalty points CRM, voucher, gateway pembayaran, status meja/antrean, hingga jurnal akuntansi buku besar.
4. **WAJIB: Audit Sinkronisasi Konfigurasi Sistem (Dynamic Settings Synchronization)**:
   - **Periksa Keterkaitan dengan Pengaturan Bisnis/Tenant**: Pastikan seluruh fungsi yang diaudit menghormati dan membaca konfigurasi dinamis yang diatur oleh Owner di menu Settings (misal: `tenant.receiptConfig`, aturan pajak PPN/PB1, service charge, pembulatan, fee admin, aturan shift, limit lisensi).
   - **Cek Konsistensi Nama Properti/DTO**: Pastikan tidak ada *property mismatch* antar modul (contoh: satu file mencari `showPb1` sementara file lain mencari `taxPb1Active`).
   - **Prinsip Anti-Hardcode**: Jangan pernah mengasumsikan nilai atau logika statis/hardcode jika sistem sebenarnya memiliki konfigurasi dinamis di Database/Settings.
5. **WAJIB: Audit Keterhubungan Lintas-Fungsi (Cross-Functional Dependency Check)**:
   - Identifikasi **SEMUA fungsi dan modul lain yang bersinggungan langsung maupun tidak langsung** dengan bug yang ditemukan:
     * *POS Kasir* $\leftrightarrow$ *Self-Order / Live Order* $\leftrightarrow$ *Shift Kasir* $\leftrightarrow$ *Kitchen (KDS)* $\leftrightarrow$ *Manajemen Meja / Antrean* $\leftrightarrow$ *Stok Gudang / BOM Resep* $\leftrightarrow$ *Laporan Penjualan & Buku Besar*.
   - Evaluasi apakah perubahan data di satu fungsi berdampak sinkron atau justru memicu *deadlock* / selisih di fungsi lain.

### 4. Laporkan Hasil Temuan, Matriks Sinkronisasi, & Rekomendasi Solusi ke User
Laporkan secara komprehensif, terstruktur, dan berbasis bukti teknis:
- **Titik Jangkar Bug**: Penjelasan masalah utama beserta file dan nomor barisnya.
- **Rantai Bug Terhubung & Hubungan Sebab-Akibat**: Hubungan hulu ke hilir dari temuan utama ke dampak ikutannya.
- **Hasil Audit Sinkronisasi Fungsi & Settings**: Status keterbacaan setting dinamis tenant, nama properti yang tidak sinkron, dan fungsi-fungsi lintas modul yang terdampak.
- **Rencana Solusi Terencana & Rekomendasi Fitur**:
  - Solusi konkret yang mempertahankan prinsip arsitektur dinamis (bebas hardcode).
  - Optimasi alur, pencegahan bottleneck, dan peningkatan UI/UX jika relevan.
- **PENTING**: Pada tahap ini, Agen **TIDAK BOLEH** langsung mengubah atau merombak kode sumber produksi.

### 5. Konfirmasi ke User untuk Melakukan Eksekusi (User Approval Gate)
- Mintalah persetujuan dan konfirmasi tertulis dari user secara jelas.
- Biarkan user meninjau laporan temuan, memberikan koreksi/masukan arah, dan memberi instruksi kapan harus mulai mengeksekusi perbaikan.

### 6. Eksekusi dengan Teliti, Benar, & Terverifikasi
- Setelah user mengonfirmasi (misal: merespons *"eksekusi"*, *"lanjutkan"*, atau *"oke"*), lakukan perbaikan tahap demi tahap secara presisi.
- Pertahankan integritas kode, preservasi komentar/tipe yang relevan, sinkronkan seluruh fungsi yang terikat, dan hindari *breaking changes* yang tidak disengaja.
- Lakukan verifikasi penuh di akhir eksekusi:
  - Uji kompilasi TypeScript: `npx tsc --noEmit` wajib exit code 0 tanpa error.
  - Verifikasi respons server Next.js (HTTP 200 OK).
  - Laporkan hasil akhir pekerjaan kepada user secara transparan.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
