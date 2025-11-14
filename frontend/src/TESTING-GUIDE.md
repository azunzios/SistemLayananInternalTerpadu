# 🧪 TESTING GUIDE - BPS NTB Ticketing System

## 📋 Daftar Akun Testing

### 1. **Super Admin**
- Email: `superadmin@bps-ntb.go.id`
- Password: `demo123`
- Akses: Semua fitur sistem

### 2. **Admin Layanan**
- Email: `adminlayanan@bps-ntb.go.id`
- Password: `demo123`
- Akses: Review tiket, Assign teknisi, Kelola Zoom

### 3. **Admin Penyedia**
- Email: `adminpenyedia@bps-ntb.go.id`
- Password: `demo123`
- Akses: Inventory, Work Order, Reports

### 4. **Teknisi 1**
- Email: `teknisi1@bps-ntb.go.id`
- Password: `demo123`
- Nama: Andi Wijaya

### 5. **Teknisi 2**
- Email: `teknisi2@bps-ntb.go.id`
- Password: `demo123`
- Nama: Rudi Hartono

### 6. **User/Pegawai 1**
- Email: `user1@bps-ntb.go.id`
- Password: `demo123`
- Nama: Dewi Lestari

### 7. **User/Pegawai 2**
- Email: `user2@bps-ntb.go.id`
- Password: `demo123`
- Nama: Joko Susilo

### 8. **User/Pegawai 3**
- Email: `user3@bps-ntb.go.id`
- Password: `demo123`
- Nama: Maya Sari

### 9. **Multi-Role: Admin Layanan + Teknisi**
- Email: `multirole1@bps-ntb.go.id`
- Password: `demo123`
- Nama: Lisa Wati

### 10. **Multi-Role: User + Admin Penyedia**
- Email: `multirole2@bps-ntb.go.id`
- Password: `demo123`
- Nama: Hendra Gunawan

### 11. **Master Account (ALL ROLES)**
- Email: `master@bps-ntb.go.id`
- Password: `demo123`
- Nama: Master Administrator
- Akses: Bisa switch ke semua role

---

## 🎯 SKENARIO TESTING

### ✅ **A. WORKFLOW ADMIN LAYANAN (PERBAIKAN BARANG)**

#### Test 1: Review & Approve Tiket Perbaikan
1. Login sebagai **Admin Layanan** (`adminlayanan@bps-ntb.go.id`)
2. Klik menu **"Kelola Tiket"**
3. Filter: Pilih **"Perbaikan"**
4. Cari tiket: **"Monitor Mati Total"** (Status: Submitted)
5. Klik tiket tersebut
6. **✅ EXPECTED**: Muncul alert card BIRU dengan tombol TOLAK dan SETUJUI
7. Klik **"Setujui"**
8. **✅ EXPECTED**: Status berubah menjadi "Disetujui"

#### Test 2: Assign Tiket ke Teknisi
1. Masih di **Admin Layanan**
2. Klik menu **"Kelola Tiket"**
3. Cari tiket: **"Keyboard Laptop Rusak Beberapa Tombol"** (Status: Disetujui)
4. Klik tiket tersebut
5. **✅ EXPECTED**: Muncul alert card HIJAU dengan tombol "Assign ke Teknisi"
6. Klik **"Assign ke Teknisi"**
7. Pilih teknisi: **Andi Wijaya** atau **Rudi Hartono**
8. **✅ EXPECTED**: Status berubah menjadi "Assigned"

#### Test 3: Reject Tiket Perbaikan
1. Masih di **Admin Layanan**
2. Buat tiket baru sebagai user (atau gunakan tiket submitted yang lain)
3. Login kembali sebagai Admin Layanan
4. Buka tiket submitted tersebut
5. Klik **"Tolak"**
6. Isi alasan penolakan
7. **✅ EXPECTED**: Status berubah menjadi "Ditolak"

#### Test 4: Pastikan TIDAK ADA Menu Work Order
1. Login sebagai **Admin Layanan**
2. **✅ EXPECTED**: Di sidebar TIDAK ADA menu "Work Order"
3. Coba akses langsung URL work order
4. **✅ EXPECTED**: Redirect ke dashboard

---

### ✅ **B. WORKFLOW ADMIN LAYANAN (ZOOM MEETING)**

#### Test 5: Approve Booking Zoom
1. Login sebagai **Admin Layanan**
2. Klik menu **"Kelola Zoom"**
3. Cari tiket Zoom dengan status "Menunggu Review"
4. Klik tiket: **"Rapat Koordinasi Sensus Pertanian 2025"**
5. Klik tombol **"Setujui"** di alert card
6. Isi Meeting Link, Meeting ID, Passcode
7. Pilih akun Zoom (Zoom 1 atau Zoom 2)
8. **✅ EXPECTED**: Status berubah menjadi "Approved" dan meeting link terisi

#### Test 6: Reject Booking Zoom
1. Masih di **Admin Layanan** → Menu "Kelola Zoom"
2. Buka tiket Zoom pending lainnya
3. Klik **"Tolak"**
4. Isi alasan penolakan
5. **✅ EXPECTED**: Status berubah menjadi "Ditolak"

---

### ✅ **C. WORKFLOW TEKNISI**

#### Test 7: Terima/Tolak Tugas dari Admin Layanan
1. Login sebagai **Teknisi 1** (`teknisi1@bps-ntb.go.id`)
2. Klik menu **"Tiket Saya"**
3. Cari tiket dengan status "Assigned" atau "Ditugaskan"
4. Klik tiket: **"Laptop Tidak Bisa Booting"**
5. **✅ EXPECTED**: Muncul alert ORANGE "Tiket Baru Ditugaskan" dengan tombol TERIMA/TOLAK
6. Klik **"Terima"**
7. **✅ EXPECTED**: Status berubah menjadi "Diterima Teknisi" atau "In Progress"

#### Test 8: Diagnosa Barang
1. Masih sebagai **Teknisi**
2. Buka tiket yang sudah diterima
3. Scroll ke bawah, cari section **"Workflow Teknisi"**
4. Klik tab **"Diagnosa"**
5. Isi form:
   - Deskripsi masalah: "Motherboard mati total"
   - Kategori: Hardware
   - Bisa diperbaiki langsung: TIDAK
   - Solusi: Butuh Sparepart
6. Klik **"Simpan Diagnosa"**
7. **✅ EXPECTED**: Data diagnosa tersimpan

#### Test 9: Buat Work Order Sparepart
1. Masih di tiket yang sama (setelah diagnosa)
2. Klik tab **"Work Order"**
3. Klik **"Buat Work Order Sparepart"**
4. Tambah item:
   - Nama: SSD 512GB
   - Qty: 1
   - Satuan: unit
   - Keterangan: Pengganti HDD rusak
5. Klik **"Kirim Work Order"**
6. **✅ EXPECTED**: Work Order dibuat, status tiket "On Hold"

#### Test 10: Buat Work Order Vendor
1. Buka tiket teknisi lain
2. Lakukan diagnosa dengan solusi: **Butuh Vendor**
3. Klik tab **"Work Order"**
4. Klik **"Buat Work Order Vendor"**
5. Isi:
   - Nama Vendor: CV Mitra Komputer
   - Kontak: 081234567890
   - Deskripsi: Perbaikan IC power laptop
6. Klik **"Kirim Work Order"**
7. **✅ EXPECTED**: Work Order vendor dibuat

#### Test 11: Selesaikan Perbaikan
1. Buka tiket dengan status "In Progress"
2. Scroll ke **Workflow Teknisi**
3. Klik **"Tandai Selesai Diperbaiki"**
4. Isi catatan teknisi
5. **✅ EXPECTED**: Status berubah menjadi "Resolved"

---

### ✅ **D. WORKFLOW ADMIN PENYEDIA**

#### Test 12: Review Work Order Sparepart
1. Login sebagai **Admin Penyedia** (`adminpenyedia@bps-ntb.go.id`)
2. Klik menu **"Work Order"**
3. Filter: **Sparepart**
4. Cari Work Order dengan status "Requested"
5. Klik Work Order tersebut
6. Klik **"Approve"**
7. **✅ EXPECTED**: Status berubah menjadi "In Procurement"

#### Test 13: Update Status Delivery Sparepart
1. Masih di **Admin Penyedia** → Menu "Work Order"
2. Buka Work Order yang sudah "In Procurement"
3. Klik **"Update Delivery"**
4. Isi estimasi tanggal pengiriman
5. Update status menjadi **"Delivered"**
6. Isi qty diterima dan keterangan
7. **✅ EXPECTED**: Status "Delivered", teknisi bisa lanjut perbaikan

#### Test 14: Kelola Inventory
1. Masih sebagai **Admin Penyedia**
2. Klik menu **"Inventory"**
3. Cari item dengan stok rendah (merah)
4. Klik item tersebut
5. Tambah stok
6. **✅ EXPECTED**: Stok bertambah, badge merah hilang jika sudah cukup

---

### ✅ **E. WORKFLOW USER/PEGAWAI**

#### Test 15: Buat Tiket Perbaikan Barang
1. Login sebagai **User** (`user1@bps-ntb.go.id`)
2. Klik menu **"Perbaikan Barang"**
3. Pilih kategori: **Komputer/Laptop**
4. Isi form:
   - Judul: Laptop Lemot
   - Deskripsi: Laptop sangat lambat saat buka aplikasi
   - Nama Barang: Laptop Dell
   - Lokasi: Ruang Produksi Lt. 2
   - Prioritas: P3
5. Upload foto (opsional)
6. Klik **"Submit Tiket"**
7. **✅ EXPECTED**: Tiket dibuat dengan status "Submitted"

#### Test 16: Buat Booking Zoom
1. Masih sebagai **User**
2. Klik menu **"Booking Zoom"**
3. Isi form:
   - Judul: Rapat Tim Mingguan
   - Deskripsi: Koordinasi progress kerja
   - Tanggal: Pilih tanggal besok
   - Jam: 10:00 - 11:00
   - Estimasi peserta: 15
   - Co-Host: Isi nama
4. Klik **"Submit Booking"**
5. **✅ EXPECTED**: Booking dibuat dengan status "Menunggu Review"

#### Test 17: Konfirmasi Perbaikan Selesai
1. Login sebagai **User** yang punya tiket "Resolved"
2. Klik menu **"Tiket Saya"**
3. Buka tiket dengan status "Resolved"
4. Klik **"Konfirmasi Selesai"**
5. Berikan rating (1-5 bintang)
6. Isi feedback
7. **✅ EXPECTED**: Status berubah menjadi "Closed"

---

### ✅ **F. MULTI-ROLE TESTING**

#### Test 18: Switch Role
1. Login sebagai **Master** (`master@bps-ntb.go.id`)
2. Klik nama user di header (pojok kanan atas)
3. **✅ EXPECTED**: Ada dropdown "Switch Role" dengan 5 pilihan role
4. Pilih **"Admin Layanan"**
5. **✅ EXPECTED**: Sidebar berubah sesuai menu Admin Layanan
6. Pilih **"Teknisi"**
7. **✅ EXPECTED**: Sidebar berubah sesuai menu Teknisi

#### Test 19: Multi-Role Workflow
1. Login sebagai **Lisa Wati** (`multirole1@bps-ntb.go.id`)
2. Default role: Admin Layanan
3. Review dan approve 1 tiket perbaikan
4. Assign ke diri sendiri (Lisa Wati sebagai teknisi)
5. Switch role ke **Teknisi**
6. Terima tugas tersebut
7. Lakukan diagnosa
8. **✅ EXPECTED**: 1 orang bisa handle 2 role berbeda

---

### ✅ **G. DASHBOARD & STATISTIK**

#### Test 20: Dashboard Admin Layanan
1. Login sebagai **Admin Layanan**
2. Klik menu **"Dashboard"**
3. **✅ EXPECTED**:
   - Card statistik: Total Tiket, Menunggu Review, Sedang Diproses, Selesai
   - Chart: Tiket Per Status (Bar/Pie chart)
   - Chart: Tiket Per Kategori
   - Daftar tiket terbaru menunggu review

#### Test 21: Dashboard Teknisi
1. Login sebagai **Teknisi**
2. Klik menu **"Dashboard"**
3. **✅ EXPECTED**:
   - Card: Tugas Aktif, Menunggu Dikerjakan, Selesai Bulan Ini
   - List tiket yang assigned ke teknisi tersebut
   - Work Order yang dibuat oleh teknisi

#### Test 22: Dashboard User
1. Login sebagai **User**
2. Klik menu **"Dashboard"**
3. **✅ EXPECTED**:
   - Card: Tiket Aktif, Menunggu Approval, Selesai
   - List tiket milik user tersebut
   - Tombol cepat buat tiket baru

---

## 🐛 CHECKLIST BUG YANG SUDAH DIPERBAIKI

- ✅ **Bug 1**: Tombol TOLAK/SETUJUI duplikat di Admin Layanan
  - **Fix**: Hapus tombol di header, hanya tampil di alert card

- ✅ **Bug 2**: Admin Layanan bisa assign langsung dari status "Submitted"
  - **Fix**: Assign hanya bisa dari status "Disetujui"

- ✅ **Bug 3**: Admin Layanan punya menu Work Order
  - **Fix**: Work Order hanya untuk Teknisi dan Admin Penyedia

- ✅ **Bug 4**: Tombol workflow teknisi hilang
  - **Fix**: Gunakan komponen TeknisiWorkflow yang sudah ada

- ✅ **Bug 5**: Import FolderKanban missing
  - **Fix**: Sudah ditambahkan di semua file yang perlu

---

## 📝 NOTES

### Status Flow Tiket Perbaikan:
```
submitted → disetujui → assigned → in_progress → resolved → closed
          ↘ ditolak
                      ↘ (jika butuh WO) on_hold → in_progress
```

### Status Flow Tiket Zoom:
```
menunggu_review → approved → completed
                ↘ ditolak
```

### Work Order Flow:
```
requested → in_procurement → delivered → closed
          ↘ rejected
```

---

## 🚀 QUICK TEST COMMANDS

1. **Reset semua data**: Refresh browser + F12 Console → `localStorage.clear()` → Reload
2. **Lihat data localStorage**: F12 Console → `localStorage`
3. **Export testing data**: Copy data dari localStorage untuk backup
4. **Check current user**: Console → `JSON.parse(localStorage.getItem('bps_ntb_current_user'))`

---

## ⚠️ KNOWN ISSUES (Belum Fix)

*(Isi jika menemukan bug baru saat testing)*

1. ...
2. ...

---

**Last Updated**: 9 November 2025
**Version**: 1.0.0
