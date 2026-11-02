---
name: system-audit
description: >-
  Protokol standar untuk mengaudit alur sistem, menemukan bugs, mengidentifikasi bottleneck,
  menelusuri masalah dari hulu ke hilir, serta menyajikan rekomendasi solusi dan fitur baru.
  Gunakan keahlian ini setiap kali user meminta audit sistem, analisa bugs, pencarian bottleneck,
  atau evaluasi alur kerja/fitur baru.
---

# Protokol Operasional Audit Sistem, Bugs & Bottleneck

Keahlian ini mengatur prosedur baku yang harus dijalankan Agen ketika pengguna meminta audit sistem, pencarian bugs, analisis kesalahan alur, atau penambahan fitur.

## Alur Prosedur Kerja (6 Langkah Baku)

### Langkah 1: Pemindaian Alur Fungsi Sistem (Scan All System Flows)
1. Periksa arsitektur sistem yang menjadi subjek audit.
2. Identifikasi titik-titik alur:
   - Skema basis data Prisma (`schema.prisma`).
   - Server Actions / Controller backend.
   - External Gateway & Webhook (misal: Midtrans, Snap, QRIS).
   - State & Komponen Client (UI Dashboard / POS Kasir).
3. Pahami bagaimana data seharusnya mengalir dari kondisi awal hingga kondisi akhir.

### Langkah 2: Berhenti Mencari yang Lain Saat Menemukan Bug Pertama (Focus Lock)
1. Begitu Anda menemukan **bug pertama** (kesalahan logika, kalkulasi salah, atau alur putus):
   - **HENTIKAN** penjelajahan acak ke modul lain yang tidak berhubungan.
   - Jangan menyebarkan fokus ke area yang tidak terkait sebelum benang merah dari bug ini terpetakan.

### Langkah 3: Penelusuran dari Hulu ke Hilir Terkait Bug Ini (Upstream-to-Downstream Tracing)
1. Gunakan temuan bug pertama sebagai jangkar penyelidikan.
2. Telusuri alurnya secara mendalam dari **hulu ke hilir**:
   - **Hulu (Upstream)**: Bagaimana data/parameter awal dibuat? Apakah ada celah di form registrasi, input kasir, atau validasi hak akses?
   - **Proses (Core)**: Bagaimana logika server memproses data tersebut? Apakah ada kesalahan rumus prorata, kuota, race condition, atau data inkonsisten?
   - **Hilir (Downstream)**: Bagaimana dampak transaksi ke tabel relasi lainnya? (Contoh: webhook payment, jurnal akuntansi, mutasi stok, poin loyalitas CRM, laporan Z-Report).
3. Sepanjang penelusuran hulu ke hilir ini, catat semua **bug turunan, bottleneck performa, dan diskoneksi data** yang saling terkait.

### Langkah 4: Penyampaian Laporan Audit & Rekomendasi Solusi
1. Susun laporan analisis yang jelas, mudah dipahami, dan berbasis bukti teknis:
   - Deskripsi bug pertama dan daftar bug turunan yang saling terkait.
   - Titik file dan baris kode yang terdampak.
   - Konsep/alur yang seharusnya berjalan (*ideal state*).
   - Rekomendasi solusi teknis, optimasi alur, dan penambahan fitur pendukung jika relevan.
2. **Jangan melakukan modifikasi kode produksi pada langkah ini**.

### Langkah 5: Konfirmasi ke Pengguna (User Approval Gate)
1. Tanyakan kepada pengguna apakah analisa dan rencana perbaikan sudah sesuai dengan ekspektasi.
2. Minta konfirmasi secara eksplisit untuk mengeksekusi perbaikan.

### Langkah 6: Eksekusi Perbaikan dengan Teliti & Terverifikasi
1. Setelah pengguna memberikan izin ("eksekusi"), laksanakan perbaikan secara sistematis.
2. Jaga kestabilan kode yang ada (tipe data, komentar relevan, fungsionalitas lain).
3. Lakukan verifikasi menyeluruh:
   - Jalankan `npx tsc --noEmit` untuk memastikan nol error TypeScript.
   - Pastikan server web aktif dan merespons normal (HTTP 200).
   - Laporkan hasil eksekusi secara transparan kepada pengguna.

