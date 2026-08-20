# Roadmap & Konsep Fitur Masa Depan (next_features.md)

Dokumen ini mendokumentasikan konsep, arsitektur, dan spesifikasi fitur lanjutan yang siap dieksekusi pada iterasi pengembangan berikutnya untuk **KasirKu / Qassa POS**.

---

## 📋 Daftar Konsep Fitur Lanjutan

### 1. 💬 Digital Receipt via WhatsApp & CRM Engine
* **Kategori:** Core POS Front-End & CRM Engagement
* **Lokasi Implementasi:** Modal Transaksi Sukses di `/pos` & Drawer Pelanggan di `/dashboard/customers`
* **Latar Belakang:**
  Mengurangi biaya kertas struk thermal fisik dan meningkatkan kepuasan pelanggan dengan mengirimkan nota digital langsung ke nomor WhatsApp pelanggan dalam 1 klik.
* **Fitur Utama:**
  1. **Tombol "Kirim Struk WhatsApp" di Modal Kasir POS**:
     - Muncul otomatis di modal pop-up setelah kasir menekan tombol bayar / lunas.
     - Jika transaksi dikaitkan dengan data pelanggan CRM, nomor WhatsApp langsung terisi otomatis.
     - Jika pelanggan umum (*Walk-in*), kasir dapat mengetik nomor HP/WA secara instan.
  2. **Format Pesan Struk Standar Industri**:
     ```text
     🧾 NOTA PEMBAYARAN DIGITAL
     ================================
     🏪 KOPI SENJA — Cabang Utama
     📍 Jl. Kemang Raya No. 45, Jakarta Selatan
     --------------------------------
     No. Faktur : #INV-20260820-8910
     Tanggal    : 20 Agustus 2026, 14:35 WIB
     Kasir      : Sarah
     Pelanggan  : Budi Santoso (Meja 04)
     --------------------------------
     2x Kopi Susu Gula Aren    Rp 40.000
        [Less Ice, Normal Sugar]
     1x Croissant Almond       Rp 25.000
     --------------------------------
     Subtotal   : Rp 65.000
     Diskon 10% : -Rp 6.500 (VOUCHER: HEMAT10)
     Total Bayar: Rp 58.500 (Lunas - QRIS)
     ================================
     Terima kasih atas kunjungan Anda! 🙏
     Lihat menu & promo terbaru kami:
     https://kasirku.id/menu/c33f2cf1
     ```
  3. **Auto-Normalisasi Format Nomor HP Indonesia**:
     - Format `0812...` otomatis dikonversi menjadi format internasional `62812...`.
     - Menggunakan `https://wa.me/62812...` yang kompatibel dengan WhatsApp Web (Desktop) dan WhatsApp Mobile App (Tablet/HP).

---

### 2. 🍳 Kitchen Display System (KDS / Layar Dapur & Barista Real-time)
* **Kategori:** Modul Vertikal Cafe & F&B
* **Lokasi Implementasi:** Halaman Khusus Tablet Dapur di `/dashboard/cafe/kitchen`
* **Latar Belakang:**
  Menggantikan pencetakan tiket kertas dapur (*kitchen runner*) dengan layar tablet interaktif tahan panas di area masak/barista.
* **Fitur Utama:**
  1. **Audio Sound Notification (Lonceng Dapur)**:
     - Efek suara *"Ting! Pesanan Baru Meja 03"* berbunyi otomatis saat ada order masuk dari kasir atau pemesanan mandiri via QR Code meja.
  2. **Kartu Pesanan Interaktif (Kanban Board Dapur)**:
     - Kolom **Antrean Baru (New Order)** &rarr; Warna Merah / Oranye (Timer berjalan: *5 menit lalu*).
     - Kolom **Sedang Dimasak (In Progress)** &rarr; Warna Kuning dengan penanda koki.
     - Kolom **Siap Saji (Ready to Serve)** &rarr; Warna Hijau untuk diambil oleh pelayan (*waiter*).
  3. **Filter Jalur Pesanan (Dapur vs Bar)**:
     - Koki dapur hanya melihat item kategori *Makanan/Snack*.
     - Barista bar hanya melihat item kategori *Kopi/Minuman*.

---

### 3. 📱 Progressive Web App (PWA) & Mode Standalone Tablet POS
* **Kategori:** System & Mobile/Tablet Usability
* **Lokasi Implementasi:** `public/manifest.json`, `public/icons/`, and Service Worker
* **Latar Belakang:**
  Memungkinkan kasir membuka KasirKu di tablet Android / iPad layaknya aplikasi Android/iOS native tanpa address bar browser yang mengganggu.
* **Fitur Utama:**
  1. **Web App Manifest (`manifest.json`)**:
     - Name: `Qassa POS - KasirKu`
     - Display: `standalone` (Full Screen)
     - Theme Color: `#0f172a` (Dark Luxe Slate)
  2. **Add to Home Screen Banner**:
     - Dialog prompt otomatis saat dibuka di browser tablet kasir.
  3. **Asset Caching**:
     - Komponen UI dan ikon disimpan lokal agar transisi halaman terasa secepat kilat (*instant loading*).

---

### 4. 🖨️ Web Bluetooth ESC/POS Direct Thermal Printing
* **Kategori:** Hardware Integration
* **Lokasi Implementasi:** `src/lib/esc-pos-printer.ts` & Komponen Cetak Kasir
* **Latar Belakang:**
  Menghilangkan pop-up dialog print browser bawaan (Ctrl+P) agar struk kasir keluar seketika (*direct silent printing*) pada printer thermal Bluetooth 58mm / 80mm.
* **Fitur Utama:**
  1. **Integrasi Web Bluetooth API**:
     - Pairing langsung dengan printer mini Bluetooth (misal: RPP02N, Panda, Iware, Eppos, thermal POS-58).
  2. **Raw ESC/POS Command Generator**:
     - Perintah potong kertas otomatis (*Auto-Cutter*), buka laci uang (*Cash Drawer Kick-out*), cetak barcode 1D & QR Code dalam mode dot-matrix thermal.

---

### 5. 🚚 Multi-Outlet Central Warehouse & Surat Jalan Transfer
* **Kategori:** Multi-Outlet Supply Chain Management
* **Lokasi Implementasi:** `/dashboard/outlets/transfers`
* **Latar Belakang:**
  Untuk bisnis berskala besar yang memiliki Gudang Pusat (*Central Warehouse / DC*) dan puluhan cabang franchise.
* **Fitur Utama:**
  1. **Alur Transfer 2-Tahap (Two-Phase Approval)**:
     - Tahap 1: Gudang Pusat membuat permintaan transfer & status `IN_TRANSIT` (stok gudang berkurang, stok cabang belum bertambah).
     - Tahap 2: Staf cabang penerima menghitung fisik & menekan tombol `[ Konfirmasi Terima ]` &rarr; status `COMPLETED` (stok cabang resmi masuk).
  2. **Cetak Surat Jalan & Lembar Pengiriman (PDF Delivery Order)**.

---

*Dokumen ini dibuat pada: 20 Agustus 2026 sebagai panduan roadmap pengembangan fitur KasirKu.*
