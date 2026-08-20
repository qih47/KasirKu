# 🚀 Panduan Migrasi Database & Aplikasi Qassa POS ke Device Lain

Dokumen ini berisi panduan lengkap langkah demi langkah untuk memindahkan/menjalankan aplikasi **Qassa POS** beserta databasenya ke perangkat, laptop, atau server baru.

---

## 📋 Prasyarat di Perangkat Baru

Pastikan perangkat baru sudah terinstall:
1. **Node.js**: Versi `v18.x` atau `v20.x` (Download di [nodejs.org](https://nodejs.org/)).
2. **PostgreSQL**: Versi 14, 15, atau 16 (Bisa via PostgreSQL Server lokal, WampServer/XAMPP add-on, Docker, atau Cloud DB seperti Supabase/Neon/Railway).

---

## ⚡ Metode 1: Inisialisasi Cepat di Device Baru (Fresh Setup + Seed Data)

Gunakan metode ini jika Anda ingin menjalankan aplikasi di device baru dengan master data default (Super Admin, Lisensi, Plugin, Tema, dan Data Bisnis Demo).

### Langkah 1: Salin Source Code
Salin folder proyek `kasirKu` ke device baru (bisa via `git clone`, flashdisk, atau zip).

### Langkah 2: Buat File `.env`
Di folder utama proyek, salin file `.env.example` menjadi `.env`:
- **Windows (PowerShell / CMD)**:
  ```bash
  copy .env.example .env
  ```
- **Mac / Linux**:
  ```bash
  cp .env.example .env
  ```

Buka file `.env` dan sesuaikan koneksi database PostgreSQL Anda:
```env
DATABASE_URL="postgresql://postgres:PASSWORD_ANDA@localhost:5432/pos_universal?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="qassa-pos-secure-key-2026"
```

> **Catatan**: Pastikan database bernama `pos_universal` (atau nama pilihan Anda) sudah dibuat di PostgreSQL / pgAdmin.

### Langkah 3: Jalankan Perintah 1 Langkah Setup
Buka terminal di root project dan jalankan:
```bash
npm run setup
```
Perintah di atas akan otomatis mengeksekusi:
1. `npm install` (mengunduh seluruh dependencies)
2. `npx prisma generate` (menyiapkan client Prisma)
3. `npx prisma db push` (membuat seluruh tabel database secara otomatis)
4. `npm run db:seed` (mengisi data awal superadmin, lisensi, plugin, tema & demo Bisnis)

### Langkah 4: Jalankan Aplikasi
```bash
npm run dev
```
Buka browser di **[http://localhost:3000](http://localhost:3000)**.

---

## 📦 Metode 2: Migrasi Membawa Data Transaksi Asli (Backup & Restore PostgreSQL)

Gunakan metode ini jika Anda ingin memindahkan seluruh database lama (lengkap dengan semua riwayat transaksi, data tenant, produk, dan laporan keuangan) dari device lama ke device baru.

### 1. Di Device LAMA (Export / Dump Database):
Buka terminal / Command Prompt di device lama dan jalankan perintah `pg_dump`:
```bash
pg_dump -U postgres -d pos_universal -F c -b -v -f qassa_backup.dump
```
*(File `qassa_backup.dump` akan dibuat di direktori saat ini).*

### 2. Di Device BARU (Import / Restore Database):
1. Salin file `qassa_backup.dump` ke device baru.
2. Buat database baru di PostgreSQL device baru (misal: `pos_universal`):
   ```sql
   CREATE DATABASE pos_universal;
   ```
3. Restore data menggunakan `pg_restore`:
   ```bash
   pg_restore -U postgres -d pos_universal -v qassa_backup.dump
   ```
4. Di folder project device baru, jalankan:
   ```bash
   npm install
   npx prisma generate
   npm run dev
   ```

---

## 🔑 Akun Bawaan (Default Login):

| Role Akun | Email Login | Password Default | Akses Halaman |
| :--- | :--- | :--- | :--- |
| **👑 Super Admin** | `admin@qassa.id` | `admin123456` | `/superadmin` (Kelola Lisensi, Plugin, Tema, Tenant) |
| **🏪 Owner Bisnis Demo** | `owner@qassa.id` | `owner123456` | `/dashboard` (Dashboard, Stok, Laporan, Pengaturan) |
| **👤 Kasir POS Demo** | `kasir@qassa.id` | `kasir123456` | `/pos` (Layar Kasir Transaksi Penjualan) |

---

## 🛠️ Daftar Perintah CLI Praktis (NPM Scripts)

- `npm run setup` : Menginstall dependencies, membuat tabel DB & mengisi seed data sekaligus.
- `npm run db:setup` : Generate Prisma client, push skema ke database & jalankan seed.
- `npm run db:push` : Mendorong perubahan skema database tanpa menghapus data.
- `npm run db:seed` : Menjalankan ulang pengisian master data default.
- `npm run db:reset` : Mereset total database dan mengisi ulang dari nol (Hati-hati: menghapus seluruh data).
