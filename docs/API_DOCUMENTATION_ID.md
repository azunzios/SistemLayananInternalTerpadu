# Dokumentasi API Sistem Layanan Internal Terpadu

## Informasi Umum

**Base URL:** `http://localhost:8000`  
**Format:** JSON  
**Versi:** 1.0.0

---

## Daftar Isi

1. [Autentikasi](#autentikasi)
2. [Manajemen Pengguna](#manajemen-pengguna)
3. [Manajemen Profil](#manajemen-profil)
4. [Manajemen Aset BMN](#manajemen-aset-bmn)
5. [Manajemen Tiket](#manajemen-tiket)
6. [Manajemen Komentar](#manajemen-komentar)
7. [Diagnosis Tiket](#diagnosis-tiket)
8. [Work Order](#work-order)
9. [Kartu Kendali](#kartu-kendali)
10. [Manajemen Zoom](#manajemen-zoom)
11. [Notifikasi](#notifikasi)
12. [Audit Log](#audit-log)
13. [Statistik & Dashboard](#statistik--dashboard)

---

## Autentikasi

### Login
**Endpoint:** `POST /api/login`

Melakukan autentikasi pengguna dan mendapatkan token akses.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** Token autentikasi dan data pengguna

---

### Logout
**Endpoint:** `POST /api/logout`

Menghapus sesi pengguna yang sedang aktif.

**Headers:** Memerlukan autentikasi

---

## Manajemen Profil

### Lupa Password
**Endpoint:** `POST /api/password/forgot`

Mengirim link reset password via email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

### Verifikasi Token Reset
**Endpoint:** `POST /api/password/verify-token`

Memverifikasi token reset password yang diterima via email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "reset-token-string"
}
```

---

### Reset Password
**Endpoint:** `POST /api/password/reset`

Melakukan reset password dengan token yang valid.

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "reset-token-string",
  "password": "NewPassword123!"
}
```

**Validasi Password:**
- Minimal 8 karakter

---

### Lihat Profil
**Endpoint:** `GET /api/profile`

Mendapatkan data profil pengguna yang sedang login.

**Headers:** Memerlukan autentikasi

---

### Update Profil
**Endpoint:** `PUT /api/profile`

Memperbarui data profil pengguna.

**Request Body:**
```json
{
  "name": "Nama Lengkap",
  "nip": "198012345678901234",
  "jabatan": "Staff IT",
  "email": "user@example.com",
  "phone": "081234567890"
}
```

**Validasi:**
- `name`: Maksimal 255 karakter (wajib)
- `jabatan`: Maksimal 255 karakter (wajib)
- `phone`: Maksimal 20 karakter (wajib)

---

### Ganti Password
**Endpoint:** `POST /api/change-password`

Mengubah password pengguna yang sedang login.

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!",
  "new_password_confirmation": "NewPassword123!"
}
```

**Validasi Password Baru:**
- Minimal 8 karakter
- Harus mengandung huruf kecil [a-z]
- Harus mengandung huruf besar [A-Z]
- Harus mengandung angka [0-9]
- Harus mengandung karakter spesial [@$!%*#?&]
- Harus berbeda dari password lama

---

### Upload Avatar
**Endpoint:** `POST /api/upload-avatar`

Mengunggah foto profil pengguna.

**Request Body:** `multipart/form-data`
- `avatar`: File gambar (maksimal 2MB)

**Validasi:**
- Harus berupa gambar
- Maksimal ukuran: 2048 KB

---

### Ganti Role Aktif
**Endpoint:** `POST /api/change-role`

Mengubah role aktif pengguna (untuk pengguna dengan multi-role).

**Request Body:**
```json
{
  "role": "teknisi"
}
```

**Role yang tersedia:** `admin`, `admin_layanan`, `teknisi`, `pegawai`

---

## Manajemen Pengguna

### Lihat Semua Pengguna
**Endpoint:** `GET /api/users`

Mendapatkan daftar semua pengguna dengan pagination.

**Query Parameters:**
- `page`: Nomor halaman
- `per_page`: Jumlah data per halaman
- `search`: Pencarian berdasarkan nama/email/NIP

**Headers:** Memerlukan autentikasi (Admin)

---

### Lihat Detail Pengguna
**Endpoint:** `GET /api/users/{id}`

Mendapatkan detail pengguna berdasarkan ID.

**Path Parameters:**
- `id`: ID pengguna (integer)

---

### Buat Pengguna Baru
**Endpoint:** `POST /api/users`

Membuat akun pengguna baru (Admin only).

**Request Body:**
```json
{
  "name": "Nama Lengkap",
  "email": "user@example.com",
  "password": "Password123!",
  "nip": "198012345678901234",
  "jabatan": "Staff IT",
  "unit_kerja": "Bagian TI",
  "phone": "081234567890",
  "roles": ["pegawai", "teknisi"],
  "is_active": true
}
```

**Validasi:**
- `name`: Maksimal 255 karakter (wajib)
- `email`: Format email valid (wajib)
- `password`: Minimal 8 karakter (wajib)
- `nip`: (wajib)
- `jabatan`: Maksimal 255 karakter (wajib)
- `unit_kerja`: Maksimal 255 karakter (wajib)
- `phone`: Maksimal 20 karakter (wajib)

---

### Update Pengguna
**Endpoint:** `PUT /api/users/{id}`

Memperbarui data pengguna (Admin only).

**Path Parameters:**
- `id`: ID pengguna

**Request Body:** (semua field opsional)
```json
{
  "name": "Nama Baru",
  "email": "newemail@example.com",
  "nip": "198012345678901234",
  "jabatan": "Manager IT",
  "unit_kerja": "Divisi TI",
  "phone": "081234567890",
  "roles": ["admin_layanan"],
  "is_active": true,
  "password": "NewPassword123!"
}
```

---

### Hapus Pengguna
**Endpoint:** `DELETE /api/users/{id}`

Menghapus pengguna dari sistem (Admin only).

**Path Parameters:**
- `id`: ID pengguna

---

### Update Role Pengguna
**Endpoint:** `PATCH /api/users/{user_id}/roles`

Memperbarui role pengguna (multi-role management).

**Path Parameters:**
- `user_id`: ID pengguna

**Request Body:**
```json
{
  "roles": ["teknisi", "pegawai"]
}
```

---

### Bulk Update Pengguna
**Endpoint:** `POST /api/users/bulk/update`

Memperbarui banyak pengguna sekaligus (Admin only).

**Request Body:**
```json
{
  "user_ids": [1, 2, 3, 4],
  "is_active": true,
  "roles": ["pegawai"]
}
```

---

## Manajemen Aset BMN

### Lihat Semua Aset
**Endpoint:** `GET /api/bmn-assets`

Mendapatkan daftar semua aset dengan filtering dan pagination.

**Query Parameters:**
- `page`: Nomor halaman
- `per_page`: Jumlah data per halaman
- `kondisi`: Filter berdasarkan kondisi (Baik, Rusak Ringan, Rusak Berat)
- `search`: Pencarian berdasarkan kode/nama barang

---

### Lihat Detail Aset
**Endpoint:** `GET /api/bmn-assets/{asset_id}`

Mendapatkan detail aset berdasarkan ID.

**Path Parameters:**
- `asset_id`: ID aset

---

### Buat Aset Baru
**Endpoint:** `POST /api/bmn-assets`

Menambahkan aset baru ke sistem.

**Request Body:**
```json
{
  "kode_satker": "123456",
  "nama_satker": "Nama Satuan Kerja",
  "kode_barang": "KB001",
  "nama_barang": "Laptop Dell",
  "nup": "NUP001",
  "kondisi": "Baik",
  "merek": "Dell Latitude",
  "ruangan": "Ruang TI Lt. 2",
  "serial_number": "SN123456789",
  "pengguna": "John Doe"
}
```

**Validasi:**
- `kode_barang`: Maksimal 50 karakter (wajib)
- `nama_barang`: Maksimal 255 karakter (wajib)
- `nup`: Maksimal 50 karakter (wajib)
- `kondisi`: Enum ["Baik", "Rusak Ringan", "Rusak Berat"] (wajib)

---

### Update Aset
**Endpoint:** `PUT /api/bmn-assets/{asset_id}`

Memperbarui data aset.

**Path Parameters:**
- `asset_id`: ID aset

**Request Body:** (semua field opsional, sama dengan create)

---

### Hapus Aset
**Endpoint:** `DELETE /api/bmn-assets/{asset_id}`

Menghapus aset dari sistem.

**Path Parameters:**
- `asset_id`: ID aset

---

### Cari Aset (untuk Tiket)
**Endpoint:** `GET /api/assets/search/by-code-nup`

Mencari aset berdasarkan kode barang dan NUP (untuk pembuatan tiket perbaikan).

**Query Parameters:**
- `kode_barang`: Kode barang
- `nup`: Nomor NUP

---

### Opsi Kondisi Aset
**Endpoint:** `GET /api/bmn-assets/kondisi-options`

Mendapatkan daftar opsi kondisi aset yang tersedia.

**Response:**
```json
[
  "Baik",
  "Rusak Ringan",
  "Rusak Berat"
]
```

---

### Download Template Excel
**Endpoint:** `GET /api/bmn-assets/template`

Mengunduh template file Excel untuk import aset.

**Response:** File Excel (.xlsx)

---

### Export Aset ke Excel
**Endpoint:** `GET /api/bmn-assets/export/all`

Mengekspor semua data aset ke file Excel.

**Response:** File Excel (.xlsx)

---

### Import Aset dari Excel
**Endpoint:** `POST /api/bmn-assets/import`

Mengimpor data aset dari file Excel.

**Request Body:** `multipart/form-data`
- `file`: File Excel (maksimal 10MB)

**Validasi:**
- Harus berupa file Excel
- Maksimal ukuran: 10240 KB

---

## Manajemen Tiket

### Lihat Semua Tiket
**Endpoint:** `GET /api/tickets`

Mendapatkan semua tiket dengan filtering.

**Query Parameters:**
- `page`: Nomor halaman
- `per_page`: Jumlah data per halaman
- `type`: Filter berdasarkan tipe (perbaikan, zoom_meeting)
- `status`: Filter berdasarkan status
- `search`: Pencarian

---

### Lihat Detail Tiket
**Endpoint:** `GET /api/tickets/{id}`

Mendapatkan detail tiket berdasarkan ID.

**Path Parameters:**
- `id`: ID tiket

---

### Buat Tiket Baru
**Endpoint:** `POST /api/tickets`

Membuat tiket baru (perbaikan atau zoom meeting).

**Request Body:** `multipart/form-data`

**Untuk Tiket Perbaikan:**
```json
{
  "type": "perbaikan",
  "title": "Laptop tidak bisa menyala",
  "description": "Laptop mati total, tidak ada indikator power",
  "kode_barang": "KB001",
  "nup": "NUP001",
  "asset_location": "Ruang TI Lt. 2",
  "severity": "high",
  "attachments": [file1, file2]
}
```

**Severity Options:** `low`, `normal`, `high`, `critical`

**Untuk Tiket Zoom Meeting:**
```json
{
  "type": "zoom_meeting",
  "title": "Rapat Koordinasi Bulanan",
  "description": "Rapat rutin koordinasi dengan seluruh staff",
  "zoom_date": "2025-12-20",
  "zoom_start_time": "09:00",
  "zoom_end_time": "11:00",
  "zoom_estimated_participants": 50,
  "zoom_co_hosts": [
    {
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "zoom_breakout_rooms": 3
}
```

**Validasi:**
- `type`: Wajib ("perbaikan" atau "zoom_meeting")
- `title`: Maksimal 255 karakter (wajib)
- `description`: Wajib
- `attachments`: File maksimal 2MB per file

---

### Update Tiket
**Endpoint:** `PUT /api/tickets/{id}`

Memperbarui data tiket.

**Path Parameters:**
- `id`: ID tiket

**Request Body:**
```json
{
  "title": "Judul Baru",
  "description": "Deskripsi baru",
  "form_data": {},
  "work_orders_ready": true
}
```

---

### Assign Tiket ke Teknisi
**Endpoint:** `PATCH /api/tickets/{ticket_id}/assign`

Menugaskan tiket kepada teknisi (Admin Layanan only).

**Path Parameters:**
- `ticket_id`: ID tiket

**Request Body:**
```json
{
  "assigned_to": 5
}
```

---

### Update Status Tiket
**Endpoint:** `PATCH /api/tickets/{ticket_id}/status`

Memperbarui status tiket.

**Path Parameters:**
- `ticket_id`: ID tiket

**Request Body:**
```json
{
  "status": "in_progress",
  "estimated_schedule": "2025-12-20",
  "notes": "Sedang dalam proses perbaikan",
  "completion_data": {
    "tindakan_dilakukan": "Penggantian RAM",
    "komponen_diganti": "RAM 8GB DDR4",
    "hasil_perbaikan": "Laptop sudah bisa menyala normal",
    "saran_perawatan": "Bersihkan heatsink secara berkala",
    "catatan_tambahan": "Perlu monitoring 1 minggu",
    "foto_bukti": "base64_encoded_image"
  }
}
```

---

### Approve Tiket Perbaikan
**Endpoint:** `PATCH /api/tickets/{ticket_id}/approve`

Menyetujui tiket perbaikan (Admin Layanan only).

**Path Parameters:**
- `ticket_id`: ID tiket

**Efek:** Status berubah menjadi "assigned"

---

### Reject Tiket Perbaikan
**Endpoint:** `PATCH /api/tickets/{ticket_id}/reject`

Menolak tiket perbaikan (Admin Layanan only).

**Path Parameters:**
- `ticket_id`: ID tiket

**Request Body:**
```json
{
  "reason": "Alasan penolakan, maksimal 500 karakter"
}
```

---

### Approve Zoom Meeting
**Endpoint:** `PATCH /api/tickets/{ticket_id}/approve-zoom`

Menyetujui booking zoom meeting (Admin Layanan only).

**Path Parameters:**
- `ticket_id`: ID tiket

**Request Body:**
```json
{
  "zoom_meeting_link": "https://zoom.us/j/123456789",
  "zoom_meeting_id": "123456789",
  "zoom_passcode": "abc123",
  "zoom_account_id": "acc-001"
}
```

---

### Reject Zoom Meeting
**Endpoint:** `PATCH /api/tickets/{ticket_id}/reject-zoom`

Menolak booking zoom meeting (Admin Layanan only).

**Path Parameters:**
- `ticket_id`: ID tiket

**Request Body:**
```json
{
  "reason": "Alasan penolakan"
}
```

---

### Jumlah Tiket per Status
**Endpoint:** `GET /api/tickets-counts`

Mendapatkan jumlah tiket berdasarkan status untuk user yang sedang login.

**Response:**
```json
{
  "submitted": 5,
  "assigned": 3,
  "in_progress": 2,
  "pending_review": 1,
  "completed": 10,
  "rejected": 2
}
```

---

### Export Tiket Zoom
**Endpoint:** `GET /api/tickets/export/zoom`

Mengekspor data tiket zoom ke Excel.

**Response:** File Excel (.xlsx)

---

### Export Semua Tiket
**Endpoint:** `GET /api/tickets/export/all`

Mengekspor semua data tiket ke Excel.

**Response:** File Excel (.xlsx)

---

### Zoom Bookings (List)
**Endpoint:** `GET /api/tickets/zoom-bookings`

Mendapatkan daftar booking zoom meeting dengan pagination.

**Query Parameters:**
- `status`: Filter status (pending_review, approved, rejected)
- `page`: Nomor halaman
- `per_page`: Jumlah data per halaman (maksimal 100)

---

### Kalender Zoom (Grid View)
**Endpoint:** `GET /api/tickets/calendar/grid`

Mendapatkan data kalender untuk zoom bookings.

**Query Parameters:**
- `date`: Tanggal (Y-m-d) untuk view daily/weekly
- `month`: Bulan (Y-m) untuk view monthly
- `view`: Mode tampilan (daily, weekly, monthly)

**Request Body:**
```json
{
  "date": "2025-12-15",
  "month": "2025-12",
  "view": "monthly"
}
```

---

## Manajemen Komentar

### Lihat Komentar Tiket
**Endpoint:** `GET /api/tickets/{ticket_id}/comments`

Mendapatkan semua komentar pada tiket dengan pagination.

**Path Parameters:**
- `ticket_id`: ID tiket

**Query Parameters:**
- `page`: Nomor halaman
- `per_page`: Jumlah data per halaman (default: 30)

**Response:** Komentar dalam urutan DESC (terbaru di atas) dengan eager load replies (maksimal 2 level)

---

### Buat Komentar
**Endpoint:** `POST /api/tickets/{ticket_id}/comments`

Membuat komentar baru pada tiket.

**Path Parameters:**
- `ticket_id`: ID tiket

**Request Body:**
```json
{
  "content": "Isi komentar (minimal 1, maksimal 5000 karakter)",
  "parent_comment_id": null
}
```

**Validasi:**
- `content`: 1-5000 karakter (wajib)
- `parent_comment_id`: Opsional, untuk reply ke komentar lain

---

## Feedback Tiket

### Buat Feedback
**Endpoint:** `POST /api/tickets/{ticket_id}/feedback`

Memberikan feedback dan rating untuk tiket yang sudah selesai.

**Path Parameters:**
- `ticket_id`: ID tiket

**Request Body:**
```json
{
  "rating": 5,
  "feedback_text": "Perbaikan sangat memuaskan"
}
```

**Validasi:**
- `rating`: 1-5 (wajib)
- `feedback_text`: Maksimal 1000 karakter (opsional)

---

### Lihat Feedback
**Endpoint:** `GET /api/tickets/{ticket_id}/feedback`

Mendapatkan feedback dari tiket.

**Path Parameters:**
- `ticket_id`: ID tiket

---

## Diagnosis Tiket

### Lihat Diagnosis
**Endpoint:** `GET /api/tickets/{ticket_id}/diagnosis`

Mendapatkan diagnosis untuk tiket perbaikan.

**Path Parameters:**
- `ticket_id`: ID tiket

---

### Buat/Update Diagnosis
**Endpoint:** `POST /api/tickets/{ticket_id}/diagnosis`

Membuat atau memperbarui diagnosis tiket (Teknisi only).

**Path Parameters:**
- `ticket_id`: ID tiket

**Request Body:**
```json
{
  "problem_description": "Deskripsi masalah yang ditemukan",
  "problem_category": "hardware",
  "repair_type": "need_sparepart",
  "repair_description": "Perlu penggantian RAM",
  "unrepairable_reason": null,
  "asset_condition_change": "Rusak Ringan",
  "alternative_solution": "Gunakan komputer cadangan sementara",
  "technician_notes": "RAM rusak total",
  "estimasi_hari": "3"
}
```

**Validasi:**
- `problem_category`: Enum ["hardware", "software", "lainnya"] (wajib)
- `repair_type`: Enum ["direct_repair", "need_sparepart", "need_vendor", "need_license", "unrepairable"] (wajib)
- `repair_description`: Wajib jika repair_type = "direct_repair"
- `unrepairable_reason`: Wajib jika repair_type = "unrepairable"
- `asset_condition_change`: Enum ["Baik", "Rusak Ringan", "Rusak Berat"] (opsional)

---

### Hapus Diagnosis
**Endpoint:** `DELETE /api/tickets/{ticket_id}/diagnosis`

Menghapus diagnosis tiket.

**Path Parameters:**
- `ticket_id`: ID tiket

---

## Work Order

### Lihat Work Orders Tiket
**Endpoint:** `GET /api/tickets/{ticket_id}/work-orders`

Mendapatkan semua work order yang terkait dengan tiket.

**Path Parameters:**
- `ticket_id`: ID tiket

---

### Lihat Semua Work Orders
**Endpoint:** `GET /api/work-orders`

Mendapatkan semua work order dengan filtering.

**Query Parameters:**
- `status`: Filter status (requested, in_procurement, completed, unsuccessful)
- `type`: Filter tipe (sparepart, vendor, license)
- `ticket_id`: Filter berdasarkan tiket
- `page`: Nomor halaman
- `per_page`: Jumlah data per halaman

---

### Lihat Detail Work Order
**Endpoint:** `GET /api/work-orders/{id}`

Mendapatkan detail work order berdasarkan ID.

**Path Parameters:**
- `id`: ID work order

---

### Buat Work Order
**Endpoint:** `POST /api/work-orders`

Membuat work order baru.

**Request Body untuk Sparepart:**
```json
{
  "ticket_id": 1,
  "type": "sparepart",
  "items": [
    {
      "name": "RAM DDR4 8GB",
      "quantity": 1,
      "unit": "pcs",
      "estimated_price": 500000,
      "remarks": "Kingston/Corsair"
    },
    {
      "name": "Thermal Paste",
      "quantity": 1,
      "unit": "tube",
      "estimated_price": 50000
    }
  ],
  "description": "Deskripsi tambahan"
}
```

**Request Body untuk Vendor:**
```json
{
  "ticket_id": 1,
  "type": "vendor",
  "vendor_name": "PT Service Komputer",
  "vendor_contact": "081234567890",
  "vendor_description": "Service AC dan pembersihan",
  "description": "Deskripsi tambahan"
}
```

**Request Body untuk License:**
```json
{
  "ticket_id": 1,
  "type": "license",
  "license_name": "Microsoft Office 365",
  "description": "License untuk 1 user"
}
```

**Validasi:**
- `type`: Enum ["sparepart", "vendor", "license"] (wajib)
- `items`: Wajib untuk type "sparepart"
- `vendor_name`, `vendor_contact`: Wajib untuk type "vendor"
- `license_name`: Wajib untuk type "license"

---

### Update Work Order
**Endpoint:** `PUT /api/work-orders/{id}`

Memperbarui data work order.

**Path Parameters:**
- `id`: ID work order

**Request Body:** (field yang ingin diubah saja)

---

### Hapus Work Order
**Endpoint:** `DELETE /api/work-orders/{id}`

Menghapus work order (hanya jika status = "requested").

**Path Parameters:**
- `id`: ID work order

---

### Update Status Work Order
**Endpoint:** `PATCH /api/work-orders/{workOrder_id}/status`

Memperbarui status work order.

**Path Parameters:**
- `workOrder_id`: ID work order

**Request Body:**
```json
{
  "status": "completed",
  "completion_notes": "Sparepart sudah terpasang",
  "failure_reason": null,
  "vendor_name": "PT Service ABC",
  "vendor_contact": "081234567890"
}
```

**Status Options:** `requested`, `in_procurement`, `completed`, `unsuccessful`

**Validasi:**
- `completion_notes`: Wajib jika status = "completed"
- `failure_reason`: Wajib jika status = "unsuccessful"

---

### Ubah Kondisi BMN (Work Order Gagal)
**Endpoint:** `PATCH /api/work-orders/{workOrder_id}/change-bmn-condition`

Mengubah kondisi aset BMN ketika work order gagal (sparepart/vendor only).

**Path Parameters:**
- `workOrder_id`: ID work order

**Request Body:**
```json
{
  "asset_condition_change": "Rusak Berat"
}
```

**Validasi:**
- `asset_condition_change`: Enum ["Baik", "Rusak Ringan", "Rusak Berat"] (wajib)

---

### Statistik Work Order
**Endpoint:** `GET /api/work-orders/stats/summary`

Mendapatkan statistik work order (jumlah per status, dll).

---

## Kartu Kendali

### Lihat Kartu Kendali (List)
**Endpoint:** `GET /api/kartu-kendali`

Mendapatkan daftar kartu kendali (1 entry per tiket perbaikan).

**Query Parameters:**
- `page`: Nomor halaman
- `per_page`: Jumlah data per halaman
- Filter lainnya

**Response:** Semua tiket type="perbaikan" ditampilkan (tidak harus punya work order)

---

### Lihat Detail Kartu Kendali
**Endpoint:** `GET /api/kartu-kendali/{ticket_id}`

Mendapatkan detail kartu kendali untuk 1 tiket perbaikan.

**Path Parameters:**
- `ticket_id`: ID tiket

**Response:** Data lengkap termasuk diagnosis, work orders (jika ada), dll.

---

### Export Kartu Kendali
**Endpoint:** `GET /api/kartu-kendali/export`

Mengekspor kartu kendali ke Excel.

**Response:** File Excel (.xlsx)

---

## Manajemen Zoom

### Lihat Akun Zoom
**Endpoint:** `GET /api/zoom/accounts`

Mendapatkan daftar akun zoom.

**Response:**
- Pegawai/Teknisi: Hanya akun aktif
- Admin: Semua akun

---

### Lihat Detail Akun Zoom
**Endpoint:** `GET /api/zoom/accounts/{id}`

Mendapatkan detail akun zoom berdasarkan ID.

**Path Parameters:**
- `id`: ID akun zoom

---

### Buat Akun Zoom
**Endpoint:** `POST /api/zoom/accounts`

Membuat akun zoom baru (Admin only).

**Request Body:**
```json
{
  "account_id": "acc-zoom-001",
  "name": "Zoom Account 1",
  "email": "zoom1@example.com",
  "host_key": "123456",
  "plan_type": "Business",
  "max_participants": 300,
  "description": "Akun zoom untuk keperluan umum",
  "color": "#3B82F6",
  "is_active": true
}
```

**Validasi:**
- `host_key`: Harus 6 karakter (wajib)
- `plan_type`: Enum ["Pro", "Business", "Enterprise"] (wajib)
- `max_participants`: Minimal 1 (wajib)
- `color`: Maksimal 20 karakter (wajib)

---

### Update Akun Zoom
**Endpoint:** `PUT /api/zoom/accounts/{id}`

Memperbarui akun zoom (Admin only).

**Path Parameters:**
- `id`: ID akun zoom

**Request Body:** (field yang ingin diubah)

---

### Hapus Akun Zoom
**Endpoint:** `DELETE /api/zoom/accounts/{id}`

Menghapus akun zoom (Admin only).

**Path Parameters:**
- `id`: ID akun zoom

---

### Bulk Update Akun Zoom
**Endpoint:** `PUT /api/zoom/accounts`

Memperbarui banyak akun zoom sekaligus (Admin only).

---

### Cek Ketersediaan Zoom
**Endpoint:** `POST /api/zoom/accounts/check-availability`

Mengecek ketersediaan akun zoom untuk tanggal dan waktu tertentu.

**Request Body:**
```json
{
  "date": "2025-12-20",
  "start_time": "09:00",
  "end_time": "11:00"
}
```

**Response:** Daftar akun zoom yang tersedia

---

### Cek Konflik Akun Zoom
**Endpoint:** `GET /api/zoom/accounts/{accountId}/conflicts`

Mendapatkan daftar konflik untuk akun zoom tertentu.

**Path Parameters:**
- `accountId`: ID akun zoom

**Request Body:**
```json
{
  "date": "2025-12-20",
  "start_time": "09:00",
  "end_time": "11:00",
  "exclude_ticket_id": 5
}
```

---

## Notifikasi

### Lihat Notifikasi
**Endpoint:** `GET /api/notifications`

Mendapatkan notifikasi user dengan pagination.

**Query Parameters:**
- `page`: Nomor halaman
- `per_page`: Jumlah data per halaman (default: 15)
- `unread_only`: Filter hanya notifikasi belum dibaca (boolean)

---

### Jumlah Notifikasi Belum Dibaca
**Endpoint:** `GET /api/notifications/unread-count`

Mendapatkan jumlah notifikasi yang belum dibaca.

**Response:**
```json
{
  "unread_count": 5
}
```

---

### Tandai Notifikasi Dibaca
**Endpoint:** `PATCH /api/notifications/{notification_id}/read`

Menandai notifikasi sebagai sudah dibaca.

**Path Parameters:**
- `notification_id`: ID notifikasi

---

### Tandai Semua Notifikasi Dibaca
**Endpoint:** `PATCH /api/notifications/read-all`

Menandai semua notifikasi user sebagai sudah dibaca.

---

### Hapus Notifikasi
**Endpoint:** `DELETE /api/notifications/{notification_id}`

Menghapus notifikasi.

**Path Parameters:**
- `notification_id`: ID notifikasi

---

## Audit Log

### Lihat Audit Log
**Endpoint:** `GET /api/audit-logs`

Mendapatkan daftar audit log (Admin only).

**Query Parameters:**
- `page`: Nomor halaman
- `per_page`: Jumlah data per halaman

---

### Lihat Audit Log Saya
**Endpoint:** `GET /api/audit-logs/my-logs`

Mendapatkan audit log untuk user yang sedang login.

---

### Lihat Detail Audit Log
**Endpoint:** `GET /api/audit-logs/{id}`

Mendapatkan detail audit log berdasarkan ID.

**Path Parameters:**
- `id`: ID audit log

---

### Buat Audit Log
**Endpoint:** `POST /api/audit-logs`

Membuat entry audit log baru.

**Request Body:**
```json
{
  "action": "login",
  "details": "User logged in successfully",
  "ipAddress": "192.168.1.100"
}
```

---

### Hapus Audit Log
**Endpoint:** `DELETE /api/audit-logs/{id}`

Menghapus audit log (Admin only).

**Path Parameters:**
- `id`: ID audit log

---

## Statistik & Dashboard

### Dashboard User (Role-based)
**Endpoint:** `GET /api/tickets/stats/dashboard`

Mendapatkan statistik dashboard untuk user berdasarkan role aktif.

**Response:** Statistik tiket yang relevan dengan role user (pegawai, teknisi, admin_layanan)

---

### Dashboard Admin
**Endpoint:** `GET /api/tickets/stats/admin-dashboard`

Mendapatkan statistik dashboard untuk admin (semua tiket, tanpa filter role).

---

### Dashboard Super Admin
**Endpoint:** `GET /api/tickets/stats/super-admin-dashboard`

Mendapatkan statistik lengkap untuk super admin.

**Response:**
```json
{
  "stats": {
    "total_users": 100,
    "total_tickets": 500,
    "total_assets": 1000
  },
  "ticketsByType": {
    "perbaikan": 300,
    "zoom_meeting": 200
  },
  "usersByRole": {
    "admin": 5,
    "admin_layanan": 10,
    "teknisi": 20,
    "pegawai": 65
  }
}
```

---

### Dashboard Admin Layanan (Lengkap)
**Endpoint:** `GET /api/tickets/stats/admin-layanan-dashboard`

Mendapatkan data dashboard lengkap untuk admin layanan dengan statistik dan trend 7 hari.

**Response:**
```json
{
  "stats": {
    "total": 100,
    "perbaikan_submitted": 30,
    "zoom_pending_review": 15,
    "closed_count": 50,
    "closed_percentage": 50
  },
  "trend_7_days": [
    {
      "date": "2025-12-15",
      "count": 10
    }
  ]
}
```

---

### Statistik Zoom Bookings
**Endpoint:** `GET /api/tickets/stats/zoom-bookings`

Mendapatkan statistik zoom booking (jumlah per status) untuk user yang sedang login.

**Response:**
```json
{
  "pending_review": 5,
  "approved": 10,
  "rejected": 2
}
```

---

### Statistik Teknisi
**Endpoint:** `GET /api/technician-stats`

Mendapatkan statistik teknisi (jumlah tiket aktif yang ditangani).

**Response:**
```json
{
  "active_tickets": 8,
  "assigned": 3,
  "in_progress": 5
}
```

---

## Status & Enum Values

### Status Tiket
- `submitted` - Tiket baru dibuat
- `assigned` - Sudah ditugaskan ke teknisi
- `in_progress` - Sedang dikerjakan
- `pending_review` - Menunggu review (khusus zoom)
- `completed` - Selesai
- `rejected` - Ditolak

### Tipe Tiket
- `perbaikan` - Tiket perbaikan aset
- `zoom_meeting` - Tiket booking zoom meeting

### Severity Tiket
- `low` - Prioritas rendah
- `normal` - Prioritas normal
- `high` - Prioritas tinggi
- `critical` - Prioritas kritis

### Kondisi Aset
- `Baik` - Kondisi baik
- `Rusak Ringan` - Rusak ringan
- `Rusak Berat` - Rusak berat

### Kategori Problem
- `hardware` - Masalah hardware
- `software` - Masalah software
- `lainnya` - Masalah lainnya

### Tipe Perbaikan
- `direct_repair` - Perbaikan langsung
- `need_sparepart` - Butuh sparepart
- `need_vendor` - Butuh vendor
- `need_license` - Butuh lisensi
- `unrepairable` - Tidak dapat diperbaiki

### Status Work Order
- `requested` - Diminta
- `in_procurement` - Sedang dalam pengadaan
- `completed` - Selesai
- `unsuccessful` - Gagal

### Tipe Work Order
- `sparepart` - Pengadaan sparepart
- `vendor` - Pengadaan vendor
- `license` - Pengadaan lisensi

### Role Pengguna
- `admin` - Administrator sistem
- `admin_layanan` - Administrator layanan
- `teknisi` - Teknisi perbaikan
- `pegawai` - Pegawai umum

### Plan Type Zoom
- `Pro` - Zoom Pro
- `Business` - Zoom Business
- `Enterprise` - Zoom Enterprise

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthenticated."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Unauthorized action."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found."
}
```

### 422 Validation Error
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "field_name": [
      "Error message 1",
      "Error message 2"
    ]
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error."
}
```

---

## Catatan Penting

1. **Autentikasi**: Sebagian besar endpoint memerlukan autentikasi menggunakan token Bearer
2. **Pagination**: Endpoint yang mengembalikan list data menggunakan pagination dengan parameter `page` dan `per_page`
3. **File Upload**: Upload file menggunakan `multipart/form-data` dengan validasi ukuran dan tipe file
4. **Date Format**: Format tanggal menggunakan `Y-m-d` (contoh: 2025-12-15)
5. **Time Format**: Format waktu menggunakan `H:i` (contoh: 09:00)
6. **Role-based Access**: Beberapa endpoint hanya dapat diakses oleh role tertentu (admin, admin_layanan, teknisi)
7. **Multi-role Support**: User dapat memiliki lebih dari satu role dan dapat beralih antar role
8. **Export Format**: Export data menghasilkan file Excel (.xlsx)

---

**Tanggal Pembaruan:** 15 Desember 2025  
**Versi Dokumentasi:** 1.0.0
