# 🚀 POS Universal — Multi-Tenant Point of Sale SaaS Platform

> **Modern, Modular, & Vertical-Adaptive Point of Sale SaaS System**  
> Dibangun dengan **Next.js 14 (App Router)**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, **NextAuth.js**, dan **Material Design 3 Clean White UI**.

---

## 🌟 Tentang Proyek

**POS Universal** adalah platform kasir SaaS multi-tenant yang dirancang khusus untuk berbagai jenis industri bisnis di Indonesia (UMKM hingga Enterprise). Menggunakan **Modular Plugin Architecture**, setiap tenant/pemilik bisnis dapat mengaktifkan modul vertikal yang sesuai dengan bidang usahanya tanpa kerumitan fitur yang tidak dibutuhkan.

---

## 💎 Fitur Utama & Modul Vertikal

### 1. 🏪 Multi-Tenant & Multi-Outlet Engine
- **Tenant Lifecycle:** Pengelolaan status akun otomatis (`TRIAL` 30 Hari &rarr; `ACTIVE` Berbayar &rarr; `LOCKED` &rarr; `FROZEN`).
- **Multi-Outlet Cabang:** Manajemen banyak cabang outlet toko dengan alokasi kuota lisensi independen.
- **Role-Based Access Control (RBAC):** Hak akses terpisah antara `OWNER`, `MANAGER`, `KASIR`, dan `SUPER_ADMIN`.

### 2. ✂️ Modul Barbershop & Salon
- **Live Chair Board (Antrian Kursi):** Manajemen visual antrian potong rambut real-time 3 status (*Menunggu*, *Sedang Pangkas*, *Selesai*).
- **Laporan Komisi Barber:** Kalkulasi otomatis sistem bagi hasil kapster (persentase jasa/nominal) dan cetak slip komisi.

### 3. ☕ Modul Cafe & Resto (F&B)
- **Denah Meja Visual (Floor Map):** Pemantauan ketersediaan meja makan real-time (*Kosong*, *Terisi*, *Billing*).
- **Kitchen Order Ticket (KOT):** Cetak tiket pesanan otomatis untuk bar & dapur.
- **Digital Menu & QR Self-Order (`/menu/[tenantId]`):** Pelanggan dapat scan QR di meja, memilih menu, dan mengirim pesanan langsung ke kasir dari smartphone.

### 4. 🛍️ Modul Retail & Minimarket
- **Manajemen SKU & Barcode Scanner:** Input dan pencarian produk otomatis menggunakan scanner barcode fisik via USB / Bluetooth.
- **Stock Low-Alert:** Peringatan otomatis ketika stok barang fisik menipis (&le; 5 unit).

### 5. 🧺 Modul Laundry Kiloan
- **Live Tracking Cucian 5 Tahap:** Pantau status laundry (*Diterima*, *Pencucian*, *Pengeringan*, *Setrika*, *Siap Diambil*).
- **Cetak Nota Laundry:** Cetak tanda terima cucian dengan estimasi berat kiloan dan tanggal selesai.

### 6. 🛒 Front-End Kasir POS & Shift Management (`/pos`)
- **Buka & Tutup Shift Kasir:** Input modal kas awal (*Opening Cash*), catat kas masuk/keluar (*Cash In/Out*), dan rekonsiliasi selisih kas fisik (*Closing Cash*).
- **Checkout Cepat & Struk Termal:** Keypad uang cepat (*Uang Pas, 50k, 100k*), hitung kembalian otomatis, dan cetak struk thermal 58mm/80mm.
- **Riwayat Transaksi (`/pos/history`):** Audit seluruh struk belanja kasir dengan fitur cetak ulang (*reprint*).

### 7. 📊 Laporan & Analytics Penjualan (`/dashboard/reports`)
- **Metrik Utama:** Total Omset, Total Transaksi, Average Order Value (AOV), dan Total Item Terjual.
- **Heatmap Jam Sibuk (Peak Hours):** Visualisasi waktu paling ramai transaksi dalam sehari.
- **Export Data:** Download laporan ke format spreadsheet (`.csv`) dan Cetak PDF resmi.

### 8. 🛡️ Super Admin Command Center (`/admin`)
- **Tenant Management:** Monitoring seluruh bisnis terdaftar, aksi perpanjangan masa trial (+7/+30 hari), aktivasi, dan penguncian akun.
- **Live Catalog Pricing:** Ubah harga lisensi, plugin, dan tema secara instan dari database tanpa deploy ulang kode.
- **Broadcast Messenger:** Kirim pengumuman darurat atau info update sistem ke seluruh tenant secara real-time.
- **Audit Logs:** Rekam jejak seluruh intervensi Super Admin.

### 9. 🎮 Simulator Bebas Coba (Guest Demo)
- **Zero-DB Sandbox:** Pengunjung dapat meracik paket lisensi, mengaktifkan plugin, dan langsung mencoba mesin kasir POS di browser lokal tanpa perlu mendaftar akun atau koneksi database.

---

## 🛠️ Tech Stack & Arsitektur

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Components, & Server Actions)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Credentials Provider dengan enkripsi `bcryptjs`)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Material Design 3 Clean Light Surfaces)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Date Utilities:** [date-fns](https://date-fns.org/)

---

## ⚙️ Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat Sistem
- **Node.js:** Versi `18.17.0` atau yang lebih baru
- **PostgreSQL:** Server PostgreSQL lokal (seperti pgAdmin, WampServer PostgreSQL, atau Docker)

### 2. Kloning Repositori
```bash
git clone <URL_REPO_ANDA>
cd projectKasir
```

### 3. Install Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Sesuaikan kredensial database PostgreSQL Anda di `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pos_universal?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="pos-universal-secret-key-change-this-in-production-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 5. Sinkronisasi Database & Seeding Data Awal
Jalankan migrasi schema dan seeder katalog default (Lisensi, Plugin, Super Admin, dan Tema):
```bash
# Push schema ke database PostgreSQL
npx prisma db push

# Jalankan database seeder
npx prisma db seed
```

### 6. Jalankan Server Pengembangan
```bash
npm run dev
```

Buka browser Anda di **[http://localhost:3000](http://localhost:3000)**.

---

## 🔑 Akun & Kredensial Pengujian Bawaan

| Role / Portal | URL Akses | Email / Username | Password | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | [`/admin/login`](http://localhost:3000/admin/login) | `superadmin@posuniversal.com` | `admin123456` | Kontrol platform & katalog harga |
| **Owner Toko (Trial)** | [`/login`](http://localhost:3000/login) | *(Daftar di `/register`)* | *(Password Anda)* | Kelola toko, cabang & langganan |
| **Guest Demo (Sandbox)** | [`/demo`](http://localhost:3000/demo) | *Bebas Coba* | *Tanpa Password* | Uji coba kasir tanpa database |

---

## 🗺️ Struktur Folder Proyek

```
projectKasir/
├── prisma/
│   ├── schema.prisma        # Definisi database schema PostgreSQL
│   └── seed.ts              # Database seeder katalog awal
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── (auth)/          # Rute login & register resmi / trial
│   │   ├── admin/           # Portal Super Admin Command Center
│   │   ├── dashboard/       # Dashboard manajemen tenant & outlet
│   │   ├── demo/            # Guest Demo & Simulator Sandbox
│   │   ├── menu/            # QR Self-Order Digital Menu
│   │   └── pos/             # Layar utama Mesin Kasir POS
│   ├── components/          # Komponen UI global (Material 3)
│   ├── lib/                 # Konfigurasi Prisma client & NextAuth
│   ├── modules/             # Business Logic & Server Actions
│   │   ├── auth/            # Otentikasi & pendaftaran tenant
│   │   ├── product/         # CRUD katalog produk & barcode SKU
│   │   ├── subscription/    # Upgrade lisensi & aktivasi plugin
│   │   ├── superadmin/      # Aksi Super Admin platform layer
│   │   ├── tenant/          # Pengaturan outlet, staff, branding, tema
│   │   └── transaction/     # Shift kasir, checkout, & laporan
│   └── plugins/             # Skeleton modular plugin vertikal
├── .env.example             # Contoh konfigurasi environment
├── .gitignore               # Konfigurasi ignore file Git
├── done.md                  # Dokumentasi milestone fitur selesai
├── PRD-Kasir-Universal.md   # Dokumen Spesifikasi Produk Lengkap
└── README.md                # Dokumentasi proyek utama
```

---

## 📄 Lisensi & Hak Cipta

Platform ini dikembangkan untuk kebutuhan POS Multi-Tenant Modern. Seluruh kode sumber dilindungi hak cipta &copy; 2026 **POS Universal**.
