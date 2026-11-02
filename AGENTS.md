# Panduan Kerja & Protokol Agen (AGENTS.md)

Dokumen ini mendefinisikan aturan dan protokol standar operasional (SOP) bagi Agen AI saat berinteraksi dan mengelola proyek **Qassa Cloud POS (projectKasir)**.

---

## PROTOKOL KHUSUS: AUDIT SISTEM, BUGS, BOTTLENECK, & REKOMENDASI ALUR

Ketika Pengguna (USER) meminta untuk melakukan **audit sistem**, **mencari bugs**, **menganalisis bottleneck**, **memeriksa ketidaksesuaian/kesalahan alur**, atau **meminta rekomendasi alur dan fitur baru**, Agen **WAJIB** mengikuti alur kerja 6 langkah berikut secara ketat dan tidak boleh melenceng:

### 1. Pindai Seluruh Sistem & Petakan Alur Fungsi (Holistic Scanning)
- Lakukan peninjauan menyeluruh terhadap alur fungsional sistem yang menjadi konteks permintaan (Database Schema Prisma, Server Actions, Middleware/Auth, Payment/API Webhooks, hingga Client Components & UI).
- Petakan alur data dan bisnis bagaimana fitur tersebut semestinya beroperasi dari awal hingga akhir.

### 2. Kunci Fokus pada Bug Pertama (Stop Looking Elsewhere)
- Segera setelah menemukan **bug atau celah logika pertama**, **HENTIKAN** pencarian isu-isu baru yang terpisah atau tidak terkait secara acak.
- Jangan melompat-lompat ke area lain sebelum menyelidiki benang merah dari temuan pertama ini.

### 3. Eksplorasi Mendalam dari Hulu ke Hilir (Upstream to Downstream Tracing)
- Gunakan bug pertama sebagai titik jangkar untuk menelusuri seluruh rantai ekosistem terkait:
  - **Hulu (Upstream)**: Sumber input, validasi skema/DTO, otentikasi peran/hak akses, state konfigurasi awal tenant/user.
  - **Tengah (Core Processing)**: Logika bisnis di server actions, transaksi database atomik, formula kalkulasi (harga/kuota/prorata/komisi/stok).
  - **Hilir (Downstream)**: Efek samping data, integrasi gateway (Midtrans/Webhooks), sinkronisasi buku besar/jurnal/stok, hingga respon tampilan di UI kasir/dashboard.
- Dengan menelusuri alur dari hulu ke hilir ini, identifikasi semua **bugs turunan, bottleneck performa, dan kegagalan sinkronisasi** yang saling terhubung di sepanjang alur tersebut.

### 4. Laporkan Hasil Temuan & Rekomendasi Solusi ke User
- Laporkan secara komprehensif dan terstruktur:
  - Rincian bug/kesalahan konsep yang ditemukan beserta lokasi file dan baris kodenya.
  - Hubungan sebab-akibat antar bug dari hulu ke hilir.
  - Solusi konkret dan terencana untuk mengatasi masing-masing masalah.
  - Rekomendasi optimasi alur, pencegahan bottleneck, atau penambahan fitur baru yang relevan untuk meningkatkan sistem.
- **PENTING**: Pada tahap ini, Agen **TIDAK BOLEH** langsung mengubah atau merombak kode sumber produksi.

### 5. Konfirmasi ke User untuk Melakukan Eksekusi
- Mintalah persetujuan dan konfirmasi tertulis dari user secara jelas.
- Biarkan user meninjau laporan temuan dan memberi arahan kapan harus mulai mengeksekusi perbaikan.

### 6. Eksekusi dengan Teliti, Benar, & Terverifikasi
- Setelah user mengonfirmasi (misal: merespons *"eksekusi"*, *"lanjutkan"*, atau *"oke"*), lakukan perbaikan tahap demi tahap secara presisi.
- Pertahankan integritas kode, preservasi komentar/tipe yang relevan, dan hindari *breaking changes* yang tidak disengaja.
- Lakukan verifikasi penuh di akhir eksekusi (seperti menjalankan uji kompilasi `npx tsc --noEmit` dan memastikan respons server tetap 200 OK tanpa error).

