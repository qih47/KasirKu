# Aturan Audit Sistem & Penelusuran Masalah

Aturan ini berlaku di seluruh repositori setiap kali user meminta audit sistem, pencarian bugs, bottleneck, pemeriksaan alur, atau rekomendasi fitur baru.

## Aturan Baku (6 Langkah Disiplin):

1. **Scan Seluruh Alur Sistem**: Pahami alur data fungsional dari awal sampai akhir.
2. **Kunci Fokus pada Bug Pertama**: Segera hentikan pencarian acak ke area lain saat menemukan bug pertama.
3. **Telusuri dari Hulu ke Hilir**: Perluas penyelidikan dari input awal (hulu), logika bisnis (tengah), hingga webhook/database/UI/laporan (hilir) untuk menemukan semua bug yang saling terhubung dalam rantai alur tersebut.
4. **Sajikan Laporan & Rekomendasi**: Paparkan temuan bugs, bottleneck, solusi perbaikan, dan rekomendasi fitur baru secara terstruktur tanpa menyentuh kode produksi terlebih dahulu.
5. **Konfirmasi Eksekusi**: Wajib minta konfirmasi dan persetujuan user sebelum melakukan perubahan kode.
6. **Eksekusi Presisi & Verifikasi**: Jalankan perubahan setelah konfirmasi user, verifikasi dengan `npx tsc --noEmit` hingga nol error dan pastikan server beroperasi normal.

