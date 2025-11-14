# 🔧 Workflow Teknisi - Sistem Ticketing BPS NTB

## 📋 Overview

Dokumen ini menjelaskan workflow lengkap teknisi dalam menangani tiket perbaikan barang, sesuai dengan activity diagram yang telah ditentukan.

## 🔄 Alur Kerja Teknisi

### 1. **Login dan Melihat Tiket**
- Teknisi login ke sistem
- Dashboard menampilkan:
  - Jumlah tugas baru yang ditugaskan
  - Tugas dalam diagnosa
  - Tugas dalam perbaikan
  - Menunggu sparepart
  - Selesai diperbaiki
- Klik "Lihat Semua Tugas" untuk melihat daftar lengkap

### 2. **Accept/Reject Tiket** (Status: `ditugaskan`)

#### Workflow:
1. Teknisi melihat tiket baru dengan status **"Ditugaskan"**
2. Teknisi memiliki 2 opsi:

**Option A: Terima Tiket**
- Klik tombol "Terima Tiket"
- Isi estimasi jadwal penyelesaian (wajib)
- Submit → Status berubah ke **"Diterima Teknisi"**
- User menerima notifikasi estimasi jadwal

**Option B: Tolak Tiket**
- Klik tombol "Tolak"
- Isi alasan penolakan (wajib)
- Submit → Tiket kembali ke Admin Layanan untuk re-assign
- Admin Layanan menerima notifikasi untuk re-assign ke teknisi lain

#### Kode Implementasi:
```typescript
// Status: ditugaskan → diterima_teknisi
handleAcceptTicket() {
  - Validasi estimasi jadwal diisi
  - Update status ke 'diterima_teknisi'
  - Simpan estimatedSchedule dan acceptedByTeknisi
  - Kirim notifikasi ke user
  - Timeline: ACCEPTED_BY_TECHNICIAN
}

// Status: ditugaskan → kembali unassigned
handleRejectTicket() {
  - Validasi alasan penolakan diisi
  - Set assignedTo = undefined
  - Kirim notifikasi ke admin layanan
  - Timeline: REJECTED_BY_TECHNICIAN
}
```

---

### 3. **Mulai Diagnosa** (Status: `diterima_teknisi`)

#### Workflow:
1. Setelah tiket diterima, tampil card "Tiket Diterima"
2. Klik tombol **"Mulai Diagnosa"**
3. Status berubah ke **"Sedang Diagnosa"**
4. User menerima notifikasi bahwa diagnosa dimulai

#### Kode Implementasi:
```typescript
// Status: diterima_teknisi → sedang_diagnosa
handleStartDiagnosa() {
  - Update status ke 'sedang_diagnosa'
  - Kirim notifikasi ke user
  - Timeline: DIAGNOSIS_STARTED
}
```

---

### 4. **Isi Form Diagnosa** (Status: `sedang_diagnosa`)

#### Workflow:
1. Teknisi melakukan pemeriksaan fisik dan testing barang
2. Klik tombol **"Isi Form Diagnosa"**
3. Isi form diagnosa dengan data:
   - **Hasil Pemeriksaan Fisik*** (wajib)
   - **Hasil Testing/Pengujian*** (wajib)
   - **Masalah yang Ditemukan*** (wajib)
   - Komponen yang Bermasalah (opsional)
   - **Tingkat Kerusakan*** (ringan/sedang/berat)
   - **Apakah Dapat Diperbaiki?*** (ya/tidak)

4. Submit form → Ada 2 jalur:

---

### 5A. **Jalur: TIDAK Dapat Diperbaiki**

#### Workflow:
1. Jika pilih "Tidak dapat diperbaiki" di form diagnosa
2. Otomatis muncul **Form Konfirmasi Tidak Dapat Diperbaiki**
3. Isi form konfirmasi:
   - **Alasan Tidak Dapat Diperbaiki*** (wajib)
   - **Rekomendasi Solusi*** (wajib) - Saran untuk user
   - Estimasi Biaya Barang Baru (opsional)
   - Catatan Tambahan (opsional)

4. Submit → Status berubah ke **"Tidak Dapat Diperbaiki"**
5. User dan Admin Layanan menerima notifikasi
6. Saran solusi dikirim ke user (biasanya: ajukan permintaan barang baru)

#### Kode Implementasi:
```typescript
// Status: sedang_diagnosa → tidak_dapat_diperbaiki
handleCannotRepair() {
  - Validasi alasan dan rekomendasi diisi
  - Update status ke 'tidak_dapat_diperbaiki'
  - Simpan diagnosa dan cannotRepairInfo
  - Set completedAt
  - Kirim notifikasi ke user dan admin layanan
  - Timeline: MARKED_CANNOT_REPAIR
}
```

#### Admin Layanan dapat:
- Melihat saran teknisi
- Klik "Ajukan Permintaan Barang Baru" → Buat tiket permintaan barang
- Tiket perbaikan ditutup setelah barang baru diterima

---

### 5B. **Jalur: DAPAT Diperbaiki - Mulai Perbaikan**

#### Workflow:
1. Jika pilih "Ya, dapat diperbaiki" di form diagnosa
2. Otomatis muncul **Form Mulai Perbaikan**
3. Isi form:
   - **Rencana Perbaikan*** (wajib) - Langkah-langkah yang akan dilakukan
   - **Estimasi Waktu Perbaikan*** (wajib)
   - Checkbox: **Perbaikan membutuhkan sparepart baru**

4. Ada 2 skenario:

**Skenario A: TIDAK Butuh Sparepart**
- Submit → Status berubah ke **"Dalam Perbaikan"**
- User menerima notifikasi estimasi waktu
- Teknisi melakukan perbaikan
- Lanjut ke langkah 7

**Skenario B: BUTUH Sparepart**
- Centang checkbox sparepart
- Submit → Otomatis muncul **Form Request Sparepart**
- Status berubah ke **"Menunggu Sparepart"**

---

### 6. **Request Sparepart** (Jika Diperlukan)

#### Workflow:
1. Muncul **Form Request Sparepart**
2. Isi form:
   - **Nama Sparepart*** (wajib)
   - **Deskripsi/Spesifikasi*** (wajib)
   - **Jumlah*** (default: 1)
   - Estimasi Harga (opsional)
   - Tingkat Urgensi (normal/mendesak/sangat mendesak)
   - **Alasan Dibutuhkan*** (wajib)

3. Submit → Sistem:
   - Update tiket perbaikan: status = **"Menunggu Sparepart"**
   - Buat tiket baru: **Request Sparepart** (type: permintaan_barang)
   - Ticket number baru: `SPR-YYYY-XXXX`
   - Linked ke tiket perbaikan asli (relatedTicketId)

4. Admin Layanan dan Admin Penyedia menerima notifikasi
5. User menerima notifikasi bahwa perbaikan menunggu sparepart

#### Kode Implementasi:
```typescript
// Status: dalam_perbaikan/sedang_diagnosa → menunggu_sparepart
handleRequestSparepart() {
  - Validasi nama dan deskripsi sparepart diisi
  - Update current ticket status ke 'menunggu_sparepart'
  - Buat tiket permintaan_barang baru untuk sparepart
  - Set relatedTicket dan relatedTicketId
  - Kirim notifikasi ke admin layanan dan user
  - Timeline: SPAREPART_REQUESTED
}
```

#### Setelah Sparepart Diterima:
- Admin Layanan/Teknisi update status ke **"Dalam Perbaikan"**
- Teknisi melanjutkan perbaikan
- Lanjut ke langkah 7

---

### 7. **Perbaikan Selesai** (Status: `dalam_perbaikan`)

#### Workflow:
1. Setelah perbaikan selesai, klik **"Perbaikan Selesai"**
2. Muncul **Form Penyelesaian Perbaikan**
3. Isi form dokumentasi:
   - **Tindakan yang Dilakukan*** (wajib)
   - Komponen yang Diganti/Diperbaiki (opsional)
   - **Hasil Perbaikan*** (wajib)
   - Saran Perawatan (opsional)
   - Catatan Tambahan (opsional)
   - Link Foto Bukti Perbaikan (opsional)

4. Submit → Sistem:
   - Status berubah ke **"Selesai"**
   - Tiket otomatis DITUTUP
   - User menerima notifikasi perbaikan selesai
   - Admin Layanan menerima notifikasi

5. User dapat melihat detail hasil perbaikan dan saran perawatan

#### Kode Implementasi:
```typescript
// Status: dalam_perbaikan → selesai
handleCompleteRepair() {
  - Validasi tindakan dan hasil perbaikan diisi
  - Update status ke 'selesai'
  - Simpan completionInfo
  - Set completedAt dan completedBy
  - Kirim notifikasi ke user dan admin layanan
  - Timeline: REPAIR_COMPLETED + CLOSED
}
```

---

## 📊 Status Transitions (Teknisi)

```
ditugaskan
    ├─[Terima]→ diterima_teknisi
    │               ↓
    │          [Mulai Diagnosa]
    │               ↓
    │          sedang_diagnosa
    │               ↓
    │         [Submit Diagnosa]
    │          /           \
    │   [Tidak Bisa]   [Bisa Diperbaiki]
    │         ↓              ↓
    │  tidak_dapat_    [Mulai Perbaikan]
    │   diperbaiki        /        \
    │                [Tidak]    [Butuh
    │                 Sparepart] Sparepart]
    │                    ↓           ↓
    │              dalam_perbaikan  menunggu_sparepart
    │                    ↓           ↓
    │                    └─[Sparepart]─→ dalam_perbaikan
    │                         Diterima         ↓
    │                                    [Selesai]
    │                                         ↓
    │                                      selesai
    └─[Tolak]→ (kembali ke admin untuk re-assign)
```

---

## 🎨 UI Components

### 1. **TeknisiWorkflow Component**
File: `/components/teknisi-workflow.tsx`

**Features:**
- Conditional action cards berdasarkan status tiket
- Form-form lengkap untuk setiap tahapan
- Validasi input yang ketat
- Toast notifications untuk feedback
- Timeline updates otomatis

### 2. **Status-based Action Cards:**

#### Status: `ditugaskan`
```tsx
<Card border-orange>
  "Tiket Baru Ditugaskan"
  Buttons: [Tolak] [Terima Tiket]
```

#### Status: `diterima_teknisi`
```tsx
<Card border-blue>
  "Tiket Diterima"
  Button: [Mulai Diagnosa]
```

#### Status: `sedang_diagnosa`
```tsx
<Card border-purple>
  "Sedang Diagnosa"
  Button: [Isi Form Diagnosa]
```

#### Status: `dalam_perbaikan`
```tsx
<Card border-green>
  "Dalam Perbaikan"
  Buttons: [Request Sparepart] [Perbaikan Selesai]
```

#### Status: `menunggu_sparepart`
```tsx
<Card border-amber>
  "Menunggu Sparepart"
  Info: Request sedang diproses
```

---

## 📝 Form Validations

### Form Diagnosa:
- ✓ Pemeriksaan Fisik (required)
- ✓ Hasil Testing (required)
- ✓ Masalah Ditemukan (required)
- ✓ Tingkat Kerusakan (required)
- ✓ Dapat Diperbaiki (required)

### Form Tidak Dapat Diperbaiki:
- ✓ Alasan Tidak Bisa (required)
- ✓ Rekomendasi Solusi (required)

### Form Mulai Perbaikan:
- ✓ Rencana Perbaikan (required)
- ✓ Estimasi Waktu (required)

### Form Request Sparepart:
- ✓ Nama Sparepart (required)
- ✓ Deskripsi (required)
- ✓ Jumlah (required, min: 1)
- ✓ Alasan Dibutuhkan (required)

### Form Penyelesaian:
- ✓ Tindakan Dilakukan (required)
- ✓ Hasil Perbaikan (required)

---

## 🔔 Notifications

### User Notifications:
- Tiket diterima teknisi + estimasi jadwal
- Diagnosa dimulai
- Menunggu sparepart
- Sparepart diterima, perbaikan dilanjutkan
- Perbaikan selesai

### Admin Layanan Notifications:
- Tiket ditolak teknisi (perlu re-assign)
- Barang tidak dapat diperbaiki
- Request sparepart baru
- Perbaikan selesai

### Admin Penyedia Notifications:
- Request sparepart baru (jika butuh pengadaan)

---

## 📱 Integration Points

### 1. **Ticket Detail Page**
- `TeknisiWorkflow` component ditampilkan hanya untuk:
  - Role: `teknisi`
  - Ticket type: `perbaikan`
  - Assigned to current user

### 2. **Dashboard Teknisi**
- Menampilkan metrics per status
- Queue tiket berdasarkan prioritas
- Quick actions

### 3. **My Tickets View**
- Filter tiket assigned to teknisi
- Sorting dan searching
- Status badges

---

## 🎯 Best Practices

### Untuk Teknisi:
1. ✅ Segera terima atau tolak tiket yang ditugaskan
2. ✅ Isi form diagnosa dengan detail dan akurat
3. ✅ Berikan estimasi waktu yang realistis
4. ✅ Update progress secara berkala
5. ✅ Dokumentasikan hasil perbaikan dengan lengkap
6. ✅ Berikan saran perawatan kepada user

### Untuk Admin Layanan:
1. ✅ Assign tiket ke teknisi yang sesuai kompetensi
2. ✅ Monitor workload teknisi (tidak overload)
3. ✅ Re-assign dengan cepat jika teknisi menolak
4. ✅ Follow up tiket yang tidak dapat diperbaiki
5. ✅ Bantu request sparepart yang urgent

---

## 🐛 Troubleshooting

### Tiket tidak muncul di dashboard teknisi:
- Check: `ticket.assignedTo === currentUser.id`
- Check: `ticket.type === 'perbaikan'`
- Lihat console log di dashboard

### Button tidak muncul:
- Check status tiket sesuai dengan expected status
- Check role: harus `teknisi`
- Check assignment

### Form tidak bisa submit:
- Check required fields sudah diisi semua
- Lihat toast error message untuk detail

---

## 📚 Related Files

```
/components/teknisi-workflow.tsx    - Main workflow component
/components/teknisi-dashboard.tsx   - Dashboard teknisi
/components/ticket-detail.tsx       - Integration point
/components/my-tickets-view.tsx     - Ticket list
/lib/storage.ts                     - Data management
/types/index.ts                     - Type definitions
```

---

## ✅ Checklist Testing

- [ ] Accept ticket dengan estimasi jadwal
- [ ] Reject ticket dengan alasan
- [ ] Mulai diagnosa
- [ ] Form diagnosa: barang dapat diperbaiki
- [ ] Form diagnosa: barang tidak dapat diperbaiki
- [ ] Form konfirmasi tidak dapat diperbaiki
- [ ] Mulai perbaikan tanpa sparepart
- [ ] Mulai perbaikan dengan sparepart
- [ ] Request sparepart (cek tiket baru dibuat)
- [ ] Perbaikan selesai dengan form lengkap
- [ ] Notifikasi ke user
- [ ] Notifikasi ke admin
- [ ] Timeline updates
- [ ] Status transitions

---

**Status:** ✅ Complete Implementation
**Version:** 1.0
**Last Updated:** 2025-10-16
