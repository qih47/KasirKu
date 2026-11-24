# Aturan Baku Audit Sistem, Bugs, Bottleneck, & Sinkronisasi Fungsi

Aturan ini berlaku di seluruh repositori setiap kali user meminta audit sistem, pencarian bugs, bottleneck, pemeriksaan alur, evaluasi inkonsistensi fungsi, atau rekomendasi fitur baru.

## 6 Langkah Disiplin Kerja:

1. **Scan Seluruh Alur Sistem**: Pahami alur data fungsional dan bisnis dari awal sampai akhir.
2. **Kunci Fokus pada Bug Pertama**: Segera hentikan pencarian acak ke area lain saat menemukan bug pertama.
3. **Telusuri Hulu ke Hilir & Audit Sinkronisasi Fungsi Sistem**: 
   - Perluas penyelidikan dari input awal (hulu), logika bisnis (tengah), hingga efek samping database/UI/laporan (hilir).
   - **Wajib Audit Konfigurasi Dinamis**: Periksa keterkaitan dengan pengaturan di menu Settings (`receiptConfig`, pajak dinamis PB1/PPN, service charge, fee admin, aturan shift). Pastikan tidak ada *property mismatch* dan bebas dari solusi *hardcode*.
   - **Wajib Audit Keterhubungan Lintas-Fungsi**: Petakan seluruh fungsi lain yang bersinggungan langsung maupun tidak langsung dengan bug (POS Kasir, Live Order, Manajemen Meja, Stok/BOM, Shift Kasir, Jurnal Akuntansi).
4. **Sajikan Laporan, Matriks Sinkronisasi, & Rekomendasi**: Paparkan temuan bugs, rantai sebab-akibat, status sinkronisasi fungsi, solusi dinamis, dan rekomendasi fitur baru secara terstruktur tanpa menyentuh kode produksi terlebih dahulu.
5. **Konfirmasi Eksekusi**: Wajib minta konfirmasi dan persetujuan tertulis dari user sebelum melakukan perubahan kode.
6. **Eksekusi Presisi & Verifikasi**: Jalankan perubahan setelah konfirmasi user, pertahankan integritas kode, verifikasi dengan `npx tsc --noEmit` hingga nol error dan pastikan server beroperasi normal (HTTP 200).
