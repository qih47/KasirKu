# Task Breakdown — Aplikasi Kasir Universal

Dokumen ini memecah roadmap di PRD (section 10) menjadi task-task kecil yang actionable, disusun berdasarkan urutan dependency. Referensi ke `PRD-Kasir-Universal.md` dan `schema.prisma` yang sudah dibuat sebelumnya.

**Cara pakai dokumen ini:** jangan kasih semua isi dokumen ini sekaligus ke AI agent dalam 1 prompt. Kerjakan **task per task atau kelompok task kecil**, verifikasi hasilnya dulu, baru lanjut ke task berikutnya. Ini mencegah agent "kebanjiran scope" dan bikin hasil kerja lebih terkontrol.

---

## FASE 1 — Core Engine & MVP

### 1.1 Setup Project
- [x] 1.1.1 Init project Next.js (App Router) + TypeScript + Tailwind CSS
- [x] 1.1.2 Setup PostgreSQL + hubungkan `schema.prisma` yang sudah dibuat, jalankan migration pertama
- [x] 1.1.3 Setup environment config (`DATABASE_URL`, secret auth, dll)
- [x] 1.1.4 Susun struktur folder modular monolith: `/modules/auth`, `/modules/tenant`, `/modules/product`, `/modules/transaction`, `/modules/subscription`, `/modules/payment`, `/modules/superadmin`

### 1.2 Autentikasi & Role Dasar
- [x] 1.2.1 Setup NextAuth.js atau custom JWT untuk login
- [x] 1.2.2 Flow registrasi: buat `Tenant` baru + `User` pertama dengan role `OWNER`
- [x] 1.2.3 Middleware role-based access — guard route berdasarkan role (`OWNER`, `KASIR`)
- [x] 1.2.4 Fitur invite Kasir oleh Owner (Owner membuat `User` baru dengan role `KASIR`, bukan pendaftaran independen — sesuai PRD section 3.2)

### 1.3 Onboarding & Tenant
- [x] 1.3.1 Landing page dasar (statis, untuk kebutuhan marketing)
- [x] 1.3.2 Flow pilih vertikal bisnis (Plugin) saat signup
- [x] 1.3.3 Auto-generate `TenantSubscription` trial: Lisensi Basic + plugin yang dipilih, `trialEndAt` = +30 hari (PRD section 5.2)
- [ ] 1.3.4 Demo publik — data dummy, dapat diakses tanpa akun, reset berkala

### 1.4 Manajemen Produk/Jasa
- [x] 1.4.1 CRUD produk generic (nama, harga, tipe `BARANG`/`JASA`, kategori, barcode)
- [x] 1.4.2 Siapkan struktur field `attributes` (JSONB) — kosong dulu, akan diisi tiap modul plugin di Fase 2-3
- [x] 1.4.3 Input scan barcode (scanner fisik terbaca sebagai keyboard input)

### 1.5 Engine Transaksi Kasir
- [x] 1.5.1 Buka/tutup shift kasir + pencatatan cash in-out (`Shift`, `CashMovement`)
- [x] 1.5.2 Buat transaksi: pilih produk, hitung total & diskon (`Transaction`, `TransactionItem`)
- [x] 1.5.3 Metode pembayaran cash manual (QRIS/transfer menyusul di Fase 4 setelah payment gateway final)
- [x] 1.5.4 Cetak struk versi awal (PDF/print browser dulu — printer thermal fisik menyusul di Fase 4)
- [x] 1.5.5 Riwayat transaksi per shift & per outlet

### 1.6 Laporan Dasar
- [x] 1.6.1 Laporan penjualan harian/bulanan
- [x] 1.6.2 Export laporan PDF/Excel (fitur Lisensi Basic ke atas)

### 1.7 Sistem Plugin (Infra Dasar)
- [x] 1.7.1 Seed data awal `Plugin` (barbershop, cafe, retail, laundry) di database
- [x] 1.7.2 Model `TenantPlugin` — aktivasi plugin per tenant
- [x] 1.7.3 Helper/middleware dynamic feature rendering — cek plugin aktif tenant, render UI sesuai (PRD section 2.2)
- [x] 1.7.4 Skeleton modul plugin kosong (infra saja, logic vertikal dibangun di Fase 2)

### 1.8 Lisensi & Billing Dasar
- [x] 1.8.1 Seed data `LicenseTier` (Basic, Pro) sesuai worksheet harga PRD section 12
- [x] 1.8.2 Enforce limit outlet/kasir sesuai lisensi aktif tenant
- [x] 1.8.3 Cron job: cek `trialEndAt`/`currentPeriodEnd` → jalankan alur locked → grace period 7 hari → freeze 30 hari → hapus (PRD section 4.6)
- [x] 1.8.4 Halaman subscribe/bayar — UI siap, integrasi payment gateway sungguhan ditunda ke Fase 4 sesuai keputusan PRD

### 1.9 Super Admin Dasar
- [x] 1.9.1 Login Super Admin — sistem terpisah dari login tenant
- [x] 1.9.2 Daftar tenant + status (trial/aktif/locked/frozen)
- [x] 1.9.3 Edit harga `LicenseTier`/`Plugin` langsung dari UI (bukan hardcode)

> **Milestone Fase 1 selesai:** aplikasi bisa dipakai end-to-end untuk 1 tenant generic — daftar, trial, transaksi dasar, laporan, tanpa modul vertikal spesifik aktif.

---

## FASE 2 — Plugin Vertikal Pertama: Barbershop
- [x] 2.1 Extend `schema.prisma`: tambah model `Booking` (tenantId, outletId, customerName, staffId, productId/serviceId, scheduledAt, status)
- [x] 2.2 Extend `schema.prisma`: tambah model `StaffCommission` atau field komisi di `TransactionItem`
- [x] 2.3 CRUD booking/antrian — buat, ubah status (booked → in_progress → done/cancelled)
- [x] 2.4 Logic komisi otomatis: hitung komisi staff dari tiap transaksi jasa yang terkait
- [x] 2.5 Dashboard khusus barbershop — jadwal booking hari ini, ringkasan komisi per staff
- [x] 2.6 Pastikan modul ini **hanya muncul** untuk tenant dengan `TenantPlugin` barbershop aktif (uji dynamic rendering dari Fase 1.7.3)
- [x] 2.7 Testing end-to-end alur lengkap: signup barbershop → trial → transaksi → booking → laporan komisi

> **Milestone Fase 2 selesai:** vertikal pertama (Barbershop) siap dipasarkan — ini yang jadi produk MVP untuk demo & user pertama.

---

## FASE 3 — Plugin Vertikal Tambahan
- [x] 3.1 Plugin Retail: SKU lanjutan, varian produk (size/warna), stok multi-gudang
- [x] 3.2 Plugin Laundry: tracking status invoice, estimasi selesai
- [x] 3.3 Plugin Cafe/F&B: manajemen meja & split bill, kitchen order ticket (KOT), modifier menu
- [x] 3.4 Custom branding (nama & logo) — aktif untuk Lisensi Basic ke atas, muncul di struk & dashboard
- [x] 3.5 Sistem Tema Preset — bangun berbasis design token (warna, font, spacing), swap real-time tanpa reload
- [x] 3.6 Katalog Tema di Super Admin — CRUD tema preset baru

---

## FASE 4 — Skala & Multi-Outlet
- [x] 4.1 Aktivasi role `ADMIN_CABANG` — permission scoped ke 1 outlet saja
- [x] 4.2 Multi-outlet management — Owner bisa tambah outlet baru sesuai limit `LicenseTier` aktif
- [x] 4.3 Laporan konsolidasi antar cabang (khusus Lisensi Pro/Enterprise)
- [x] 4.4 **Keputusan final payment gateway** (Midtrans vs Xendit) — lihat PRD section 11, dibahas ulang sebelum mulai task ini
- [x] 4.5 Integrasi payment gateway penuh: QRIS, transfer/VA, webhook konfirmasi otomatis
- [x] 4.6 Billing lengkap: upgrade/downgrade lisensi, tambah/kurangi plugin (full charge, no proration — PRD section 4.5), billing tahunan dengan diskon 17%
- [x] 4.7 Integrasi printer thermal fisik (ESC/POS via WebUSB/Bluetooth atau print-bridge agent) — device final dipilih sebelum task ini
- [x] 4.8 Alur Tema Custom — form request → notifikasi ke Super Admin → proses konsultasi manual

---

## FASE 5 — Value-Add
- [x] 5.1 Dashboard analytics lanjutan — produk terlaris, jam ramai, tren penjualan
- [x] 5.2 Integrasi self-order/QR code untuk pelanggan (khususnya plugin Cafe)
- [x] 5.3 Sistem notifikasi/broadcast dari Super Admin ke tenant
- [x] 5.4 Audit log lengkap (histori perubahan harga, suspend akun, dll)
- [x] 5.5 Eksplorasi fitur berbasis AI (microservice Python terpisah) — opsional, sesuai demand

---

## Catatan Penting Sebelum Mulai

1. **Jangan lompat fase.** Fase 2 (plugin Barbershop) bergantung penuh pada infra plugin & dynamic rendering dari Fase 1.7 — kalau itu belum solid, modul vertikal apa pun yang dibangun di atasnya berisiko rapuh.
2. **Setiap kali extend `schema.prisma`** (seperti di Fase 2.1-2.2), jalankan migration dan update dokumentasi schema, jangan biarkan file `schema.prisma` asli jadi kadaluarsa.
3. **Task yang butuh keputusan eksternal** (4.4 payment gateway, 4.7 device printer) — selesaikan diskusi/keputusannya dulu sebelum minta AI agent mulai coding task tersebut, supaya agent tidak menebak-nebak.
4. **Testing end-to-end di akhir tiap fase** (seperti 2.7) penting dilakukan sebelum lanjut fase berikutnya — ini titik paling murah untuk menangkap kesalahan sebelum menumpuk ke fase selanjutnya.
