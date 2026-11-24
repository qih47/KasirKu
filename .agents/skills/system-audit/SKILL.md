---
name: system-audit
description: >-
  Protokol standar untuk mengaudit alur sistem, menemukan bugs, mengidentifikasi bottleneck,
  menelusuri masalah dari hulu ke hilir, memeriksa sinkronisasi fungsi & konfigurasi sistem dinamis,
  serta menyajikan rekomendasi solusi dan fitur baru. Gunakan keahlian ini setiap kali user meminta
  audit sistem, analisa bugs, pencarian bottleneck, evaluasi alur kerja, atau penambahan fitur.
---

# Protokol Operasional Audit Sistem, Bugs, Bottleneck, & Sinkronisasi Fungsi

Keahlian ini mengatur prosedur baku yang harus dijalankan Agen ketika pengguna meminta audit sistem, pencarian bugs, analisis kesalahan alur, atau penambahan fitur.

## Alur Prosedur Kerja (6 Langkah Baku)

### Langkah 1: Pemindaian Alur Fungsi Sistem (Scan All System Flows)
1. Periksa arsitektur sistem yang menjadi subjek audit.
2. Identifikasi titik-titik alur:
   - Skema basis data Prisma (`schema.prisma`).
   - Server Actions / Controller backend.
   - Konfigurasi tenant & pengaturan bisnis (`receiptConfig`, attributes, plugins).
   - External Gateway & Webhook (misal: Midtrans, Snap, QRIS).
   - State & Komponen Client (UI Dashboard / POS Kasir / Layar Publik).
3. Pahami bagaimana data dan bisnis seharusnya mengalir dari kondisi awal hingga kondisi akhir (*ideal state*).

### Langkah 2: Berhenti Mencari yang Lain Saat Menemukan Bug Pertama (Focus Lock)
1. Begitu Anda menemukan **bug pertama** (kesalahan logika, kalkulasi salah, atau alur putus):
   - **HENTIKAN** penjelajahan acak ke modul lain yang tidak berhubungan.
   - Jangan menyebarkan fokus ke area yang tidak terkait sebelum benang merah dari bug ini terpetakan secara utuh.

### Langkah 3: Penelusuran Hulu ke Hilir & Audit Sinkronisasi Fungsi Sistem (Upstream-to-Downstream & Function Synchronization)
Gunakan temuan bug pertama sebagai jangkar penyelidikan, lalu periksa:
1. **Hulu (Upstream)**: Bagaimana data/parameter awal dibuat dan divalidasi? Apakah ada celah input, manipulasi harga client, atau otentikasi peran yang terlewat?
2. **Proses (Core)**: Bagaimana logika server memproses data? Cek transaksi atomik, formula kalkulasi, race condition, dan validasi stok/kuota.
3. **Hilir (Downstream)**: Bagaimana efek samping data ke relasi lain? (Contoh: webhook payment, jurnal akuntansi, mutasi stok, poin loyalitas CRM, laporan Z-Report).
4. **Audit Sinkronisasi Konfigurasi Sistem (Dynamic Settings Check)**:
   - Periksa apakah fungsi membaca dan menghormati konfigurasi yang disimpan di Database/Settings (misal: `tenant.receiptConfig`, aturan pajak PPN/PB1, service charge, biaya admin, aturan shift, limit kuota).
   - Pastikan tidak ada inkonsistensi nama properti (*property mismatch*) antar modul backend dan frontend.
   - **Prinsip Anti-Hardcode**: Jangan menambal dengan nilai atau logika statis jika sistem memiliki konfigurasi dinamis di Settings.
5. **Audit Keterhubungan Lintas-Fungsi (Cross-Functional Dependency Check)**:
   - Identifikasi SEMUA fungsi dan modul lain yang berhubungan dengan bug yang terdeteksi:
     * *POS Kasir* $\leftrightarrow$ *Self-Order / Live Order* $\leftrightarrow$ *Shift Kasir* $\leftrightarrow$ *Kitchen (KDS)* $\leftrightarrow$ *Meja / Antrean* $\leftrightarrow$ *Stok / Resep BOM* $\leftrightarrow$ *Buku Besar Akuntansi*.
   - Evaluasi apakah perubahan data di satu fungsi berdampak sinkron atau justru memicu *deadlock* / selisih di fungsi lain.

### Langkah 4: Penyampaian Laporan Audit & Rekomendasi Solusi
1. Susun laporan analisis komprehensif berbasis bukti teknis:
   - Deskripsi bug pertama dan daftar bug turunan yang saling terhubung.
   - Titik file dan nomor baris kode yang terdampak.
   - Hasil audit sinkronisasi fungsi sistem & konfigurasi dinamis (nama field, settings tenant).
   - Rekomendasi solusi teknis yang dinamis (bebas hardcode), optimasi alur, dan fitur pendukung.
2. **Dilarang keras melakukan modifikasi kode produksi pada langkah ini**.

### Langkah 5: Konfirmasi ke Pengguna (User Approval Gate)
1. Tanyakan kepada pengguna apakah analisa dan rencana perbaikan sudah sesuai dengan ekspektasi.
2. Berikan kesempatan user untuk mengoreksi atau memberi arahan tambahan.
3. Minta konfirmasi secara eksplisit ("eksekusi") sebelum memulai pengubahan kode.

### Langkah 6: Eksekusi Perbaikan dengan Teliti & Terverifikasi
1. Setelah pengguna memberikan izin ("eksekusi"), laksanakan perbaikan secara sistematis.
2. Jaga kestabilan kode yang ada (tipe data, komentar relevan, fungsionalitas lain).
3. Lakukan verifikasi menyeluruh:
   - Jalankan `npx tsc --noEmit` untuk memastikan nol error TypeScript.
   - Pastikan server web aktif dan merespons normal (HTTP 200).
   - Laporkan hasil eksekusi secara transparan dan detail kepada pengguna.
