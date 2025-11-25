# Form Diagnosa Perbaikan - Panduan Penggunaan

## Cara Mengakses Form Diagnosa

1. **Login sebagai Teknisi**
2. **Buka Tiket Perbaikan** yang sudah di-assign ke Anda
3. **Klik tombol "Isi Diagnosa"** yang muncul di halaman detail tiket
4. Form diagnosa akan terbuka dalam modal dialog

## Struktur Form (4 Tab)

### Tab 1: Pemeriksaan Awal

- **Kondisi Fisik Barang**: Deskripsikan kondisi fisik (casing, layar, dll)
- **Hasil Inspeksi Visual**: Hasil inspeksi visual internal (motherboard, komponen, dll)
- **Foto Dokumentasi**: Upload max 5 foto (jpg/png, max 5MB per file)

### Tab 2: Identifikasi Masalah

- **Deskripsi Masalah** (Required): Jelaskan masalah secara detail
- **Kategori Masalah** (Required): Hardware / Software / Lainnya
- **Sub-kategori**: Detail kategori (contoh: motherboard, RAM, OS corrupt)
- **Hasil Testing**: Hasil pengujian yang sudah dilakukan
- **Komponen Bermasalah**: Daftar komponen yang rusak beserta detailnya

### Tab 3: Estimasi Perbaikan

- **Status Perbaikan** (Required): Dapat diperbaiki / Tidak dapat diperbaiki
- **Jika Dapat Diperbaiki**:
  - Tingkat Kesulitan: Mudah / Sedang / Sulit / Sangat Sulit
  - Estimasi Waktu (dalam jam)
- **Jika Tidak Dapat Diperbaiki**:
  - Alasan (Required)
  - Solusi Alternatif (ganti unit, pinjam cadangan, dll)
- **Tandai sebagai Urgent**: Centang jika prioritas tinggi

### Tab 4: Rekomendasi

- **Rekomendasi Solusi**: Langkah-langkah perbaikan yang disarankan
- **Membutuhkan Sparepart**:
  - Centang jika butuh sparepart
  - Tambahkan daftar sparepart (nama, qty, unit, estimasi harga)
- **Membutuhkan Vendor Eksternal**:
  - Centang jika butuh vendor
  - Jelaskan alasan butuh vendor
- **Catatan Teknisi**: Catatan tambahan untuk admin/teknisi lain

## Cara Menyimpan

### Simpan Draft

- Klik **"Simpan Draft"** untuk menyimpan progress sementara
- Draft bisa diedit kembali kapan saja
- Hanya required fields (deskripsi masalah) yang perlu diisi minimal

### Selesaikan Diagnosa

- Klik **"Selesaikan Diagnosa"** untuk finalisasi
- Semua field required harus diisi
- Status diagnosis akan menjadi "Completed"
- Diagnosis yang completed bisa di-revisi jika diperlukan

## Validasi Form

### Required Fields:

1. **Deskripsi Masalah** (Tab 2)
2. **Kategori Masalah** (Tab 2)
3. **Status Perbaikan** (Tab 3)
4. **Alasan Tidak Dapat Diperbaiki** (Tab 3, jika status = tidak dapat diperbaiki)

### Optional Fields:

- Semua field lainnya optional tapi sangat direkomendasikan untuk diisi

## Tips Pengisian

1. **Isi Secara Bertahap**: Gunakan fitur "Simpan Draft" untuk menyimpan progress
2. **Dokumentasi Foto**: Upload foto kondisi barang untuk referensi
3. **Detail Sparepart**: Isi estimasi harga sparepart untuk memudahkan procurement
4. **Catatan Lengkap**: Berikan catatan sejelas mungkin untuk admin/teknisi lain
5. **Urgent Flag**: Gunakan dengan bijak, hanya untuk kasus benar-benar urgent

## Status Diagnosis

- **Draft**: Masih dalam proses pengisian, bisa diedit bebas
- **Completed**: Sudah selesai dan final
- **Revised**: Sudah diselesaikan tapi ada revisi

## Integrasi dengan Ticket

- Diagnosis akan otomatis muncul di detail tiket setelah disimpan
- Admin dan pegawai bisa melihat hasil diagnosis
- Hanya teknisi yang assigned bisa membuat/edit diagnosis
- 1 tiket = 1 diagnosis (tidak bisa buat duplikat)

## Endpoint API yang Digunakan

- **GET** `/api/tickets/{ticket}/diagnosis` - Lihat diagnosis
- **POST** `/api/tickets/{ticket}/diagnosis` - Create/Update diagnosis
- **DELETE** `/api/tickets/{ticket}/diagnosis` - Hapus draft diagnosis

## Troubleshooting

### Form tidak muncul

- Pastikan Anda login sebagai teknisi
- Pastikan tiket adalah tipe "perbaikan"
- Pastikan tiket sudah di-assign ke Anda

### Gagal menyimpan

- Periksa koneksi internet
- Pastikan file foto tidak lebih dari 5MB
- Pastikan deskripsi masalah sudah diisi

### Edit diagnosis completed

- Saat ini hanya bisa edit dengan create diagnosis baru (akan otomatis update)
- Atau hapus draft dan buat ulang
