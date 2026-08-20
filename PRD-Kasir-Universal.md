# Product Requirement Document (PRD)
## Aplikasi Kasir Universal (Multi-Vertical POS)

**Versi:** 1.0 (Draft Awal)
**Tanggal:** 16 Agustus 2026
**Status:** Perencanaan

---

## 1. Ringkasan Produk

Aplikasi kasir (POS) berbasis web yang bisa dikonfigurasi sesuai jenis bisnis pengguna (barbershop, cafe, retail, dll). Berbeda dari POS konvensional, sistem ini menyesuaikan fitur, dashboard, dan tampilan berdasarkan **vertikal bisnis (plugin)** dan **lisensi kapasitas** yang dipilih pengguna — sehingga tiap pengguna hanya melihat fitur yang relevan dengan bisnisnya, dan hanya membayar untuk modul yang benar-benar dipakai.

### 1.1 Tujuan Produk
- Menyediakan satu platform kasir yang bisa melayani berbagai jenis bisnis tanpa perlu membangun aplikasi terpisah per industri.
- Memberikan pengalaman yang sederhana untuk UMKM, dengan opsi berkembang ke skala enterprise/franchise.
- Membangun model bisnis berlangganan (SaaS) yang berkelanjutan.

### 1.2 Target Pengguna
- UMKM pemilik usaha jasa/retail skala kecil-menengah (cafe, barbershop, salon, retail, laundry, dll).
- Pemilik bisnis dengan banyak cabang (franchise) sebagai target jangka menengah-panjang.

---

## 2. Prinsip Arsitektur Produk

### 2.1 Core + Config-Driven Modules (Plugin)
Sistem dibangun dengan **core engine generic** yang berlaku untuk semua bisnis, ditambah **modul vertikal (plugin)** yang aktif/nonaktif sesuai plugin yang dibeli pengguna. Setiap plugin adalah unit bisnis (dan billing) terpisah — lihat section 4 untuk skema harganya.

**Core Engine (termasuk dalam Lisensi, berlaku semua vertikal):**
- Manajemen produk/jasa
- Transaksi & pembayaran (cash, QRIS, transfer)
- Scan barcode
- Cetak struk (printer fisik)
- Shift kasir (buka/tutup kasir, cash in-out)
- Laporan penjualan
- Manajemen role & user

**Plugin Vertikal (dijual & dibayar terpisah, dikembangkan bertahap):**
| Plugin | Modul di Dalamnya |
|---|---|
| Barbershop/Salon | Booking/antrian, komisi per staff |
| Cafe/F&B | Meja & split bill, kitchen order ticket, modifier menu |
| Retail | Barcode/SKU, varian produk, stok multi-gudang |
| Laundry | Tracking status per invoice, estimasi selesai |

### 2.2 Dynamic Feature Rendering
UI, dashboard, dan menu yang muncul untuk tiap pengguna ditentukan secara dinamis oleh kombinasi:
1. **Plugin vertikal** yang dibeli/diaktifkan (bisa lebih dari satu plugin dalam 1 akun)
2. **Lisensi kapasitas** aktif (Basic/Pro/Enterprise)

Fitur yang tidak termasuk plugin/lisensi pengguna **tidak ditampilkan sama sekali** di UI (bukan sekadar disabled), agar antarmuka tetap sederhana sesuai kebutuhan masing-masing pengguna.

---

## 3. Struktur Tenant & Role

### 3.1 Hierarki Struktur Tenant (Skeleton Penuh)
```
Owner (pemilik tenant/bisnis, mis. pemilik barbershop)
  └── Admin Cabang (skeleton — belum aktif di MVP)
        └── Kasir
```

### 3.2 Scope MVP
- **MVP hanya mengaktifkan 2 role:** Owner dan Kasir.
- **Struktur database dirancang untuk 3 level penuh sejak awal** (role disimpan sebagai entitas/enum generic, bukan hardcoded boolean), termasuk struktur **outlet/cabang**, agar tidak perlu migrasi besar saat fitur Admin Cabang & multi-outlet diaktifkan di fase berikutnya.
- Sub-akun (Admin Cabang, Kasir) dibuat melalui invitasi oleh Owner — bukan pendaftaran independen. Billing tetap terpusat di akun Owner.

### 3.3 Role Platform: Super Admin (Pemilik Aplikasi)

**Terpisah total** dari hierarki tenant di atas — bukan bagian dari struktur Owner/Admin Cabang/Kasir manapun, karena scope-nya lintas-tenant (bisa melihat & mengelola semua tenant), sementara role tenant apa pun hanya bisa mengakses data tenant-nya sendiri. Secara teknis, ini entitas login & permission yang benar-benar terpisah dari tabel user tenant.

Ini adalah dashboard milik pemilik platform (developer/pemilik bisnis SaaS ini) untuk menjalankan operasional bisnisnya:

| Fitur | Deskripsi |
|---|---|
| Manajemen Tenant | Lihat semua tenant terdaftar, status (trial/aktif/locked/frozen), lisensi & plugin aktif, suspend/aktifkan akun manual |
| Manajemen Billing & Revenue | Dashboard MRR/ARR, riwayat pembayaran per tenant, override manual (extend trial, refund) untuk customer support |
| Manajemen Katalog Produk | CRUD harga Lisensi/Plugin/Tema langsung dari UI (tanpa redeploy kode), tambah plugin vertikal baru atau tema preset baru ke katalog — ini yang membuat worksheet harga di section 12 menjadi pengaturan yang benar-benar bisa diubah, bukan sekadar dokumen |
| Monitoring & Analytics | Jumlah tenant aktif per vertikal, tingkat konversi trial→paid, churn rate, plugin/tema paling laku |
| Notifikasi/Broadcast | Kirim pengumuman ke seluruh atau sebagian tenant (maintenance, promo, dll) |
| Support Tools | Lihat data tenant tertentu untuk membantu troubleshooting. **Catatan privasi:** idealnya read-only dengan log akses (siapa membuka data siapa, kapan) untuk akuntabilitas |
| Audit Log | Histori perubahan penting yang dilakukan Super Admin (ubah harga, suspend akun, dll) |

---

## 4. Model Subscription: Lisensi + Plugin

Tagihan pengguna terdiri dari **2 komponen terpisah**:

```
Total Tagihan = Harga Lisensi (kapasitas & fitur umum) + Harga Plugin Vertikal yang diaktifkan
```

- **Lisensi** mengatur kapasitas & fitur umum yang tidak spesifik ke satu jenis bisnis (jumlah outlet, jumlah kasir, branding, analytics, dukungan).
- **Plugin** adalah modul vertikal bisnis (Barbershop, Cafe, Retail, dst) yang dibeli terpisah sesuai kebutuhan. Pengguna bisa mengaktifkan lebih dari satu plugin dalam satu akun (misal pemilik yang punya barbershop sekaligus cafe).

Model ini dipilih (menggantikan skema tier generik lama) karena selaras dengan arsitektur "core + config-driven module" — modul vertikal memang sudah terpisah secara teknis, sehingga wajar dijual terpisah secara bisnis juga. Ini juga membuat pengguna hanya membayar untuk apa yang mereka pakai, dan membuka jalur upsell alami (tambah plugin baru saat bisnis berkembang ke vertikal lain).

### 4.1 Lisensi (Kapasitas & Fitur Umum)

| Lisensi | Harga/Bulan | Outlet | Kasir/User per Outlet | Custom Branding | Analytics | Dukungan |
|---|---|---|---|---|---|---|
| **Basic** | Rp 150.000 | 1 | 3–5 | ✅ | Dasar | Email/chat |
| **Pro** | Rp 500.000 | hingga 5–10 | Unlimited/tinggi | ✅ + laporan konsolidasi antar cabang | Lengkap | Prioritas |
| **Enterprise** | Konsultasi langsung | Custom (bisa 1000+) | Custom | ✅ + role Admin Cabang, API | Lengkap | Dedicated + SLA |

> Catatan: Enterprise tidak dijual sebagai paket standar — untuk skala besar (misal franchise ratusan/ribuan cabang), harga & scope (termasuk plugin yang dipakai) dinegosiasikan langsung dengan Owner produk sebagai satu paket bundling.

### 4.2 Plugin Vertikal

| Plugin | Harga/Bulan (contoh) | Modul di Dalamnya |
|---|---|---|
| **Barbershop/Salon** | Rp 50.000 | Booking/antrian, komisi per staff |
| **Retail** | Rp 60.000 | Barcode/SKU, varian produk, stok multi-gudang |
| **Laundry** | Rp 40.000 | Tracking status invoice, estimasi selesai |
| **Cafe/F&B** | Rp 100.000 | Meja & split bill, kitchen order ticket, modifier menu |

*(Harga plugin mengikuti kompleksitas modulnya — Cafe paling mahal karena modulnya paling kompleks dibangun. Angka contoh, bisa disesuaikan berdasarkan riset pasar/kompetitor.)*

**Contoh tagihan:** Owner barbershop dengan Lisensi Basic + Plugin Barbershop = Rp 150.000 + Rp 50.000 = **Rp 200.000/bulan**.

**Menambah plugin baru ke akun yang sudah aktif** (misal owner barbershop mau tambah plugin Cafe): dikenakan full charge harga plugin baru, tidak perlu trial ulang karena akun sudah menjadi paying customer, mengikuti kebijakan upgrade di section 4.5.

### 4.3 Billing Tahunan
Selain langganan bulanan, tersedia opsi **pembayaran per tahun** dengan diskon **17%**, berlaku untuk komponen Lisensi maupun Plugin.

| Komponen | Harga Bulanan | Harga Tahunan (diskon 17%) | Hemat |
|---|---|---|---|
| Lisensi Basic | Rp 150.000 | **Rp 1.494.000** | Rp 306.000 |
| Lisensi Pro | Rp 500.000 | **Rp 4.980.000** | Rp 1.020.000 |
| Plugin Barbershop | Rp 50.000 | **Rp 498.000** | Rp 102.000 |

*(Angka bisa dibulatkan ke nominal lebih rapi saat implementasi.)*

### 4.4 Tema UI (Theme Add-on)

Selain Lisensi & Plugin, tersedia komponen tagihan ke-3 yang opsional: **Tema UI**. Dipisah jadi 2 level karena beda cara kerja & effort:

| Jenis Tema | Model | Harga/Bulan | Biaya Setup |
|---|---|---|---|
| Tema Default | Gratis, termasuk di semua lisensi | Rp 0 | – |
| Paket Tema Preset | Add-on bulanan, akses seluruh katalog tema siap-pakai (self-service, langsung apply) | `[ISI HARGA]` | – |
| Tema Custom | Konsultasi langsung dengan Owner — desain/layout unik sesuai request, dikerjakan manual | `[ISI HARGA]`/bulan (biaya maintenance tambahan) | `[ISI HARGA]` (biaya setup satu kali, nego sesuai kompleksitas) |

**Formula tagihan lengkap (update):**
```
Total Tagihan = Lisensi + Plugin Vertikal + Tema (opsional)
```

**Catatan implementasi:** Tema Preset dibangun berbasis design token (warna, font, spacing) yang bisa di-swap tanpa bangun ulang komponen — cepat dikembangkan & ditambah ke katalog seiring waktu. Tema Custom (layout/struktur berbeda, bukan sekadar warna) ditahan sebagai jasa custom development, bukan fitur self-service, karena effort-nya tidak sebanding kalau dijual dengan harga flat otomatis.

### 4.5 Kebijakan Upgrade (Naik Lisensi / Tambah Plugin / Tambah Tema)
- **Dikenakan full charge** sesuai harga lisensi/plugin/tema baru — tidak ada proration/kembalian dari sisa periode sebelumnya.
- Fitur baru langsung aktif setelah pembayaran berhasil, UI ter-update secara real-time tanpa perlu logout-login ulang.

### 4.6 Kebijakan Trial Habis, Downgrade & Langganan Tidak Diperpanjang
Berlaku untuk: (1) trial berakhir tanpa subscribe, (2) downgrade lisensi, (3) plugin/langganan aktif yang tidak diperpanjang.

1. **Akun terkunci (locked)** — begitu trial/langganan berakhir tanpa pembayaran, operasional kasir (transaksi) dihentikan. Pengguna masih bisa login untuk melihat data, tapi tidak bisa bertransaksi.
2. **Grace Period: 7 hari** — pengguna diberi waktu untuk:
   - Backup data
   - Melakukan pembayaran/subscribe untuk mengaktifkan kembali akun
   - Untuk kasus downgrade lisensi: memilih outlet/data mana yang tetap ingin diaktifkan sesuai limit lisensi baru
3. **Setelah Grace Period (7 hari) habis tanpa aksi:**
   - Data (atau outlet yang tidak dipilih, untuk kasus downgrade) berstatus **frozen** (dibekukan, bukan langsung dihapus)
4. **Masa freeze: 30 hari** — jika dalam periode ini pengguna tidak melakukan pembayaran/upgrade untuk "mencairkan" data:
   - Data **dihapus permanen**
5. **Disclaimer kebijakan ini ditampilkan jelas** sejak awal pendaftaran (bukan hanya di halaman T&C), disertai notifikasi aktif (H-7, H-3, H-1) di setiap tahap kritis.

---

## 5. Alur Onboarding, Trial & Demo

### 5.1 Demo Publik (untuk kebutuhan iklan/marketing)
- Dapat diakses **tanpa pendaftaran akun**.
- Menggunakan data dummy, seluruh tampilan bisa dijelajahi, tapi tidak bisa disimpan permanen (reset berkala).
- Tujuan: memberi calon pengguna gambaran produk secara cepat dari iklan.

### 5.2 Alur Pendaftaran & Trial
1. **Landing page** → user (calon Owner) klik daftar/masuk.
2. **Login / buat akun.**
3. **Pilih vertikal bisnis** (plugin) — misal Barbershop, Cafe, Retail. Ini menentukan modul apa yang aktif di akunnya.
4. **Trial 30 hari (1 bulan)** langsung aktif untuk kombinasi **Lisensi Basic + Plugin vertikal yang dipilih** — tanpa perlu input metode pembayaran di awal (mengurangi gesekan pendaftaran).
5. **Setelah trial berakhir**, dua kemungkinan:
   - **Subscribe & bayar** (Lisensi + Plugin sekaligus) → akses aktif penuh, dan pengguna bisa menambah plugin vertikal lain kapan saja ke akun yang sama.
   - **Tidak bayar** → akun **terkunci**, lalu mengikuti alur **grace period 7 hari → freeze 30 hari → hapus permanen** sesuai kebijakan section 4.6.

---

## 6. Pembayaran (Payment Integration)

### 6.1 Metode Pembayaran
- Cash (manual input)
- QRIS
- Transfer bank / Virtual Account
- (Opsional lanjutan) Kartu debit/kredit

### 6.2 Payment Gateway
- Menggunakan pihak ketiga berizin resmi (PJP dari Bank Indonesia) — kandidat: **Midtrans** atau **Xendit**.
- Sistem terintegrasi via API + webhook untuk update status transaksi otomatis.
- Biaya transaksi (MDR) mengikuti ketentuan gateway/regulasi BI (referensi: QRIS ~0.7%, VA mulai ~Rp 4.000, kartu kredit ~2.9% + Rp 2.000) — **perlu keputusan bisnis** apakah biaya ini ditanggung platform atau dibebankan ke pengguna (merchant).

---

## 7. Hardware

- **Printer struk:** printer thermal fisik (proBisnisl ESC/POS), koneksi via USB/Bluetooth dari browser (WebUSB/WebBluetooth) atau melalui print-bridge agent lokal. Pemilihan device spesifik menyusul.
- **Scan barcode:** mendukung barcode scanner fisik (USB/Bluetooth, umumnya terbaca sebagai keyboard input) dan/atau scan via kamera device.

---

## 8. Non-Functional Requirements

- **Offline-first:** transaksi kasir harus tetap bisa berjalan tanpa koneksi internet, dengan sinkronisasi otomatis ke server saat koneksi kembali tersedia.
- **PWA (Progressive Web App):** dapat diinstal ke home screen, berjalan di berbagai device (tablet, laptop, HP) tanpa perlu app store.
- **Multi-tenant:** isolasi data antar tenant (Bisnis/bisnis) harus terjamin aman.
- **Real-time UI update:** perubahan tier/fitur langsung tercermin di antarmuka pengguna.

---

## 9. Tech Stack

```
Frontend       : Next.js (App Router) + TypeScript + Tailwind CSS
Backend        : Node.js (TypeScript) — modular monolith di awal,
                 disusun per domain (auth, transaction, subscription,
                 payment, dst) agar siap dipecah ke microservice
                 saat traffic/skala membutuhkan
Database       : PostgreSQL
ORM            : Prisma
Auth           : NextAuth.js / custom JWT (role-based access)
Offline Storage: IndexedDB (via Dexie.js) di sisi kasir
Payment Gateway: Midtrans atau Xendit
PWA            : next-pwa
Future/Optional: Microservice Python untuk analytics/AI lanjutan
```

**Catatan arsitektur:** Microservices penuh **tidak digunakan di fase awal** mengingat pengembangan dilakukan solo. Pendekatan modular monolith dipilih agar tetap terstruktur rapi namun tidak menambah beban operasional (deployment, monitoring, komunikasi antar-service) yang biasanya membutuhkan tim. Pemecahan ke microservice dilakukan bertahap di masa depan berdasarkan bottleneck nyata.

---

## 10. Roadmap Pengembangan (Bertahap)

**Fase 1 — Core Engine & MVP**
- Autentikasi & role (Owner, Kasir)
- Manajemen produk/jasa generic
- Transaksi kasir (cash, QRIS, transfer)
- Scan barcode & cetak struk
- Shift kasir & laporan dasar
- Struktur Lisensi Basic & Pro (tanpa Free tier)
- Sistem plugin (aktivasi modul vertikal per akun)
- Trial 30 hari (Lisensi Basic + 1 plugin) + Demo publik + alur akun locked
- **Super Admin dasar**: daftar tenant, status langganan, dan pengaturan harga Lisensi/Plugin dari UI (belum perlu fitur analytics/broadcast canggih di MVP, cukup yang esensial untuk operasional)

**Fase 2 — Plugin Vertikal Pertama**
- Sistem pemilihan plugin saat onboarding
- Bangun & luncurkan plugin pertama: **Barbershop/Salon** (booking, komisi staff), untuk divalidasi ke pasar

**Fase 3 — Plugin Vertikal Tambahan**
- Perluasan plugin ke vertikal lain (Cafe, Retail, Laundry) sesuai demand pengguna
- Custom branding (nama & logo) untuk Lisensi Basic ke atas

**Fase 4 — Skala & Multi-Outlet**
- Aktivasi role Admin Cabang
- Multi-outlet & laporan konsolidasi (tier Pro/Enterprise)
- Payment gateway penuh + kebijakan billing upgrade/downgrade

**Fase 5 — Value-Add**
- Dashboard analytics lanjutan
- Integrasi self-order/QR code pelanggan
- Eksplorasi fitur berbasis AI (opsional, via microservice Python)

---

## 11. Hal yang Masih Perlu Diputuskan

- [ ] **Pemilihan final payment gateway** (Midtrans vs Xendit) beserta skema pembebanan biaya MDR — **keputusan ini sengaja ditunda ke tahap akhir development**, dibahas kembali saat implementasi fitur pembayaran sudah dekat.
- [x] ~~Harga pasti tiap lisensi~~ — **Fixed:** Basic Rp 150.000/bulan, Pro Rp 500.000/bulan, Enterprise via konsultasi. **Tidak ada Free tier.**
- [x] ~~Model billing vertikal~~ — **Fixed: Lisensi (kapasitas) + Plugin (vertikal) sebagai 2 komponen tagihan terpisah.** Lihat section 4. Harga plugin per vertikal masih contoh (Barbershop Rp 50rb, Retail Rp 60rb, Laundry Rp 40rb, Cafe Rp 100rb) — perlu divalidasi lebih lanjut ke pasar.
- [x] ~~Persentase diskon billing tahunan~~ — **Fixed: 17%**, berlaku untuk Lisensi maupun Plugin.
- [ ] Pemilihan device printer thermal — belum ditentukan
- [x] ~~Durasi trial & grace period~~ — **Fixed:** Trial 30 hari (Lisensi Basic + 1 plugin, tanpa Free tier) → Akun locked → Grace period 7 hari → Freeze 30 hari → hapus permanen.
- [x] ~~Prioritas vertikal bisnis pertama~~ — **Fixed: Barbershop/Salon**, karena kompleksitas plugin lebih rendah dan kompetisi pasar lebih longgar dibanding Cafe/F&B. Strategi awal mengandalkan Demo Publik untuk marketing/iklan karena belum ada akses ke calon user langsung.
- [ ] **Harga final Tema UI** (Paket Preset & Tema Custom) — lihat worksheet section 12 untuk isi sendiri.

---

## 12. Worksheet Kalkulasi Harga (Isi Sendiri)

Tabel ini kumpulan semua komponen harga di satu tempat biar gampang di-adjust. Kolom "Harga Bulanan" tinggal diisi, kolom "Harga Tahunan" otomatis mengikuti rumus diskon 17% yang sudah disepakati.

**Rumus Harga Tahunan:**
```
Harga Tahunan = Harga Bulanan x 12 x (1 - 17%)
             = Harga Bulanan x 12 x 0.83
```

| Komponen | Harga Bulanan | Harga Tahunan (rumus di atas) | Catatan |
|---|---|---|---|
| Lisensi Basic | Rp 150.000 *(contoh — silakan sesuaikan)* | = Bulanan x 12 x 0.83 | Kapasitas: 1 outlet, 3-5 kasir |
| Lisensi Pro | Rp 500.000 *(contoh — silakan sesuaikan)* | = Bulanan x 12 x 0.83 | Kapasitas: 5-10 outlet |
| Lisensi Enterprise | Nego | – | Custom, konsultasi langsung |
| Plugin Barbershop | Rp 50.000 *(contoh — silakan sesuaikan)* | = Bulanan x 12 x 0.83 | Modul: booking, komisi staff |
| Plugin Retail | Rp 60.000 *(contoh — silakan sesuaikan)* | = Bulanan x 12 x 0.83 | Modul: SKU, varian, stok |
| Plugin Laundry | Rp 40.000 *(contoh — silakan sesuaikan)* | = Bulanan x 12 x 0.83 | Modul: tracking invoice |
| Plugin Cafe/F&B | Rp 100.000 *(contoh — silakan sesuaikan)* | = Bulanan x 12 x 0.83 | Modul: split bill, KOT, modifier |
| Tema Preset (add-on) | `[ISI]` | = Bulanan x 12 x 0.83 | Akses seluruh katalog tema |
| Tema Custom — biaya bulanan | `[ISI]` | = Bulanan x 12 x 0.83 | Maintenance tema custom |
| Tema Custom — biaya setup | `[ISI]` (one-time) | – | Nego sesuai kompleksitas desain |

**Contoh kalkulasi total tagihan bulanan** (Owner barbershop, Lisensi Basic + Plugin Barbershop + Tema Preset):
```
Total = Lisensi Basic + Plugin Barbershop + Tema Preset
      = Rp 150.000 + Rp 50.000 + [harga tema] 
      = [isi sesuai harga final]
```

**Cara pakai worksheet ini:** ganti semua angka contoh di kolom "Harga Bulanan" dengan harga final versi lo, kolom tahunan tinggal dihitung pakai rumus yang sama (x12 x0.83) supaya diskon 17% tetap konsisten di semua komponen. Kalau nanti mau ubah persentase diskon tahunan, tinggal ganti angka 0.83 di rumus (misal diskon 20% → x0.80).
