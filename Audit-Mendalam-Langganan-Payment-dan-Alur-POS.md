# Audit Menyeluruh: Sistem Langganan (SaaS Licensing), Payment Gateway, & Alur Operasional POS Multi-Vertikal

Dokumen ini merangkum hasil audit kode sumber (*source code inspection*) secara menyeluruh terhadap tiga jantung utama sistem **Qassa Cloud POS**:
1. **Mesin Langganan & Lisensi SaaS (`Subscription`, `Proration`, `Quota`, & `Feature Entitlements`)**
2. **Arsitektur Pembayaran Terpadu (`SaaS Billing`, `Store Marketplace`, `POS Kasir QRIS/Split`, `QR Meja Self-Order`, & `Midtrans Webhook`)**
3. **Alur Operasional POS Multi-Vertikal End-to-End (`Shift` $\rightarrow$ `Stasiun POS` $\rightarrow$ `Transaksi` $\rightarrow$ `Stok/Resep/Komisi/Jurnal` $\rightarrow$ `Z-Report`)**

---

## BAGIAN 1: Audit Kritis Sistem Langganan (`Subscription` & `Licensing`)

Hasil pemeriksaan pada `src/modules/subscription/actions.ts`, `src/app/dashboard/subscription/subscription-client.tsx`, `src/modules/tenant/staff-actions.ts`, dan `src/modules/auth/actions.ts` menemukan **7 celah logika dan ketidaksinkronan serius**:

### 1. Celah "Perpanjangan Lisensi Gratis" Saat Menambah 1 Plugin Vertikal di Tengah Masa Aktif (*Co-Terming Bug*)
- **Lokasi Kode**: `src/app/dashboard/subscription/subscription-client.tsx` (Baris 175–229) vs `src/modules/subscription/actions.ts` (Baris 188–196).
- **Temuan Masalah**:
  - Ketika tenant sedang memiliki paket aktif (contoh: **Paket PRO 1 Tahun**, sisa 10 bulan) dan hanya mencentang **1 modul vertikal tambahan** (contoh: *Laundry* Rp 40.000/bln) tanpa mengubah tier (`isTierChanged === false`) dan tanpa mengubah pilihan durasi di UI (`isDurationChanged === false`), kalkulator di `subscription-client.tsx` menetapkan `tierCostToday = 0` sehingga tagihan yang dibayar hanya harga modul Laundry.
  - **NAMUN**, saat pembayaran selesai dan memanggil `upgradeSubscriptionAction`, server mengecek `existingActiveSub.licenseTierId === licenseTierId` lalu mengeksekusi:
    ```ts
    const baseEndDate = existingActiveSub.currentPeriodEnd > now ? existingActiveSub.currentPeriodEnd : now;
    const periodEnd = addMonths(baseEndDate, durationMonths);
    ```
  - **Dampak Fatal**: Tenant hanya membayar harga add-on vertikal (Rp 40.000), tetapi masa aktif lisensi utama **PRO** miliknya otomatis bertambah `durationMonths` (hingga 12 bulan) secara **gratis**!
- **Konsep yang Seharusnya (*Co-Termed Add-On vs Renewal*)**:
  - Harus dibedakan secara eksplisit antara **`RENEW`** (Perpanjang Paket) dan **`ADD_PLUGIN_MID_CYCLE`** (Tambah Modul di Tengah Masa Aktif).
  - Jika tenant hanya menambah plugin di tengah siklus aktif tanpa klik tombol "Perpanjang", maka `currentPeriodEnd` **tidak boleh bertambah** (tetap mengikuti akhir periode aktif saat ini), dan biaya plugin dihitung **prorata sesuai sisa hari/bulan** sampai `currentPeriodEnd`.

### 2. Upgrade Tier (Basic -> Pro) Tidak Menghitung Nilai Sisa (*Unused Prorated Credit*) Paket Lama
- **Lokasi Kode**: `src/app/dashboard/subscription/subscription-client.tsx` (Baris 180) & `src/modules/subscription/actions.ts` (Baris 164–174).
- **Temuan Masalah**:
  - Jika tenant baru membayar **Basic 1 Tahun** (Rp 1.494.000), lalu 5 hari kemudian ingin *upgrade* ke **Pro 1 Tahun**, kode saat ini langsung menonaktifkan langganan Basic (`isActive: false`) dan menagih 100% harga Pro penuh tanpa memotong nilai sisa (*unused balance*) dari 360 hari paket Basic yang sudah dibayar.
- **Konsep yang Seharusnya**:
  - Saat *Upgrade Tier* di tengah masa aktif, sistem harus menghitung:
    `Kredit Sisa Paket Lama = (Sisa Hari Aktif / Total Hari Siklus Lama) * Harga Paket Lama`
    `Tagihan Upgrade Hari Ini = max(0, Harga Paket Baru - Kredit Sisa Paket Lama)`

### 3. Ketidaksinkronan Perhitungan Kuota Kasir antara `/dashboard/subscription` vs `/dashboard/staff` & Celah Bypass Kuota
- **Lokasi Kode**: `src/modules/subscription/actions.ts` (Baris 38–78) vs `src/modules/tenant/staff-actions.ts` (Baris 51–53 & 131–167).
- **Temuan Masalah**:
  1. Di `getSubscriptionDashboardData`, `cashiersUsed` menghitung semua `users: { where: { role: "KASIR" } }`. Ini ikut menghitung **staf operasional non-kasir** (`hasPosAccess: false`, seperti Kapster Barbershop, Terapis, atau Petugas Cuci Laundry) serta akun yang sudah **dinonaktifkan** (`isActive: false`).
  2. Di `createStaffAction`, pengecekan kuota kasir dibungkus dalam `if (outletId)`. Jika Owner membuat akun Kasir dengan penugasan **"Semua Cabang (Global)"** (`outletId: null`), **validasi kuota kasir terlewati sepenuhnya (100% bypass)**!
  3. Di `toggleStaffStatusAction`, ketika kasir yang non-aktif diaktifkan kembali (`isActive: true`), tidak ada pengecekan apakah kuota kasir paket saat ini masih mencukupi.

### 4. Bug Downgrade Paket (Pro -> Basic): Tampilan Nominal QRIS Salah & Akun Kasir Berlebih Tidak Dibekukan
- **Lokasi Kode**: `src/app/dashboard/subscription/subscription-client.tsx` (Baris 357–400, 1153, 1291) & `src/modules/subscription/actions.ts` (Baris 239–265).
- **Temuan Masalah**:
  - Fungsi `handleConfirmDowngrade` membuat tagihan QRIS/Snap sebesar `downgradeTotalAmount`, tetapi komponen Modal Pembayaran QRIS/VA di baris 1153 & 1291 merender teks `grandTotalToday` (yang bernilai Rp 0 atau berbeda dari `downgradeTotalAmount`).
  - Di sisi server, `downgradeSubscriptionWithResolutionAction` membekukan cabang ke-2 dst (`extraOutletIds`), tetapi **tidak menonaktifkan akun kasir di cabang utama jika jumlahnya melebihi batas Basic (5 kasir)**.

### 5. `upgradeSubscriptionAction` Tidak Memverifikasi Status Pembayaran di Server
- **Lokasi Kode**: `src/modules/subscription/actions.ts` (Baris 135–218).
- **Temuan Masalah**:
  - Server action `upgradeSubscriptionAction` langsung mengaktifkan paket di database tanpa memvalidasi tiket/status pembayaran (`paymentOrderId`).

### 6. `FeatureEntitlementsMatrix` Belum Menjaga Action Sensitif di Server
- **Lokasi Kode**: `src/modules/features/feature-actions.ts`.
- **Temuan Masalah**:
  - Matriks fitur yang diatur SuperAdmin di `/admin/catalog` (`evaluateTenantFeatureAccess`) belum dipasang sebagai *server-side guard* pada modul-modul tingkat lanjut (seperti Multi-Outlet, Komisi Pegawai, Jurnal Akuntansi, dan Manajemen Meja).

### 7. Registrasi Tenant Baru Memberikan 2 Layout Sekaligus Secara Hardcoded
- **Lokasi Kode**: `src/modules/auth/actions.ts` (Baris 239).
- **Temuan Masalah**:
  - Saat mendaftar akun baru (bahkan ketika hanya memilih 1 vertikal seperti `retail` atau `laundry`), `initialReceiptConfig` meng-hardcode `purchasedLayoutIds: ["CAFE_QUICK_ORDER", "BARBERSHOP_STATION"]`, bukan menyesuaikannya dengan vertikal yang dipilih saat registrasi.

---

## BAGIAN 2: Audit Kritis Sistem Payment (`SaaS`, `Marketplace`, `POS Kasir`, `Self-Order`, & `Webhook`)

Pemeriksaan pada `src/modules/payment/actions.ts`, `src/lib/midtrans.ts`, `src/app/api/webhooks/midtrans/route.ts`, `src/app/dashboard/store/store-client.tsx`, dan `src/app/pos/pos-client.tsx` mengungkap **4 masalah arsitektur pembayaran yang sangat krusial**:

### 1. Webhook Midtrans untuk Langganan SaaS (`/api/webhooks/midtrans`) Gagal 100% Karena Parsing UUID `order_id`
- **Lokasi Kode**: `src/modules/payment/actions.ts` (Baris 178 & 232) vs `src/app/api/webhooks/midtrans/route.ts` (Baris 134–180).
- **Temuan Masalah**:
  - Di `generateSaaSDynamicQrisAction`, `orderId` dibuat dengan memotong UUID tenant menjadi 8 karakter saja:
    `SUB-QRIS-${user.tenantId.substring(0, 8)}-${tierCode}-${durationMonths}M-${Date.now()}`
  - Di `createSaaSSnapInvoiceAction`, `orderId` menggunakan UUID penuh yang memiliki **4 tanda hubung (`-`)**:
    `SUB-${user.tenantId}-${tierCode}-${durationMonths}M-${Date.now()}`
  - Ketika Midtrans menembak webhook ke `/api/webhooks/midtrans/route.ts`, kode melakukan `const parts = order_id.split("-")`:
    - `parts[1]` hanya mengambil `"597e1934"` (bukan UUID utuh)!
    - `parts[2]` mengambil `"21fc"` (potongan UUID kedua, bukan `tierCode`)!
    - `parts[3]` mengambil `"4ad7"` (potongan UUID ketiga, bukan `durationMonths`)!
  - **Dampak Fatal**: Query `prisma.licenseTier.findUnique({ where: { code: tierCode } })` dan `prisma.tenant.update({ where: { id: tenantId } })` di dalam webhook **selalu gagal 100%**. Bahkan jika berhasil pun, webhook tidak mengetahui daftar `selectedPluginIds` yang dibeli tenant karena tidak disimpan di record invoice!

### 2. Alur QRIS Dinamis di POS Kasir Terputus dari Database & Tombol "Cetak Struk" Tidak Terkunci
- **Lokasi Kode**: `src/app/pos/pos-client.tsx` (Baris 908–1006 & 4540) vs `src/modules/payment/actions.ts` (Baris 35–159 & 312).
- **Temuan Masalah**:
  1. Saat kasir klik metode **QRIS** di modal pembayaran POS, fungsi `generateQris` membuat ID sementara `POS-${Date.now()}` hanya di memori browser (`activeQrisOrderId`), **tanpa menyimpan intent/transaksi `PENDING` di database**.
  2. Ketika pelanggan membayar QRIS tersebut dan Midtrans mengirim webhook ke `/api/webhooks/midtrans` (atau saat tombol simulasi memanggil `simulatePaymentWebhookAction("POS-...")`), server mencari `prisma.transaction.findFirst({ where: { OR: [{ transactionNumber: order_id }, { id: order_id }] } })`. Hasilnya **selalu `null`** karena transaksi baru disimpan ke database *setelah* kasir menekan tombol bayar (`handleProcessPayment`), dan itu pun menggunakan nomor baru `TRX-YYYYMMDD-XXXX`!
  3. Lebih berbahaya lagi, pada `pos-client.tsx` (Baris 4540), tombol **"Konfirmasi Lunas QRIS & Cetak Struk"** hanya memiliki `disabled={isProcessingPayment}` tanpa mengecek `paymentMethod === "QRIS" && !isQrisVerified`. Artinya kasir dapat langsung mencetak struk lunas walau QRIS belum dibayar!

### 3. Pembelian Item Berbayar di Store Marketplace (`/dashboard/store`) Langsung Aktif Tanpa Pembayaran
- **Lokasi Kode**: `src/app/dashboard/store/store-client.tsx` (Baris 129–185).
- **Temuan Masalah**:
  - Untuk kategori **Modul Vertikal**, tombol beli sudah mengarahkan ke `/dashboard/subscription`.
  - Namun untuk **Tema UI Premium**, **Layout POS Premium**, dan **Tema Struk Thermal Berbayar** (`priceMonthly > 0`), menekan tombol beli di Store langsung memanggil `applyUiThemeAction` / `purchasePosLayoutAction` / `purchaseReceiptThemeAction` yang mengaktifkan item tersebut **secara gratis tanpa melalui modal pembayaran QRIS/VA**!

### 4. Ketidaklengkapan Checkout Live Order (QR Meja / Self-Order) dibanding Transaksi Kasir Utama
- **Lokasi Kode**: `src/modules/self-order/actions.ts` (Baris 336–529).
- **Temuan Masalah**:
  - Ketika pesanan dari QR Meja diselesaikan oleh kasir melalui `checkoutLiveOrderAction`, fungsi tersebut:
    1. **Tidak menghitung Pajak (`taxAmount`) & Service Charge (`serviceCharge`)** dari konfigurasi outlet (`receiptConfig`).
    2. **Tidak memberikan poin loyalitas (`points`)** kepada member (hanya menambah `visits` dan `totalSpent`).
    3. **Tidak memotong stok bahan baku Resep (`Recipe` / BOM)** dan **tidak membuat Jurnal Akuntansi Otomatis (`recordSaleJournal`)** sebagaimana yang dilakukan oleh `createTransactionAction`.

---

## BAGIAN 3: Rencana Eksekusi Perbaikan Terstruktur

1. **Tahap 1 — Perbaikan Mesin Langganan, Prorata, Co-Terming Plugin, & Kuota Kasir/Staff**
2. **Tahap 2 — Perbaikan Arsitektur Payment SaaS, Webhook Midtrans, & Store Marketplace Checkout**
3. **Tahap 3 — Perbaikan Alur Pembayaran QRIS Dinamis di POS Kasir**
4. **Tahap 4 — Sinkronisasi Pipeline Checkout Live Order (QR Meja) & Guard Fitur**

