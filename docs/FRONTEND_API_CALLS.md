# Daftar API Calls dari Frontend

**Generated:** 15 Desember 2025  
**Total API Calls:** 120  
**Total Unique Endpoints:** 49  
**Total Files:** 22

---

## 📊 Statistik Penggunaan

| Method | Jumlah Calls |
|--------|--------------|
| PATCH  | 38           |
| GET    | 32           |
| POST   | 28           |
| PUT    | 18           |
| DELETE | 4            |

---

## 📋 Daftar Endpoint yang Digunakan

### Autentikasi & Profil

#### `POST /change-password`
Mengganti password user yang sedang login
- **File:** `frontend/src/components/views/shared/profile-settings.tsx:131`

#### `POST change-role`
Mengganti role aktif user (multi-role support)
- **File:** `frontend/src/lib/storage.ts:471`

#### `POST logout`
Logout user dari sistem
- **File:** `frontend/src/lib/storage.ts:639`

---

### Manajemen Aset BMN

#### `GET /bmn-assets?${params}`
Mendapatkan list aset BMN dengan filtering dan pagination
- **File:** `frontend/src/components/bmn-asset-management.tsx:100`

#### `POST /bmn-assets`
Membuat aset BMN baru
- **File:** `frontend/src/components/bmn-asset-management.tsx:157`

#### `PUT /bmn-assets/${id}`
Update aset BMN
- **File:** `frontend/src/components/bmn-asset-management.tsx:154`

#### `DELETE /bmn-assets/${id}`
Hapus aset BMN
- **File:** `frontend/src/components/bmn-asset-management.tsx:178`

#### `POST /bmn-assets/import`
Import aset dari file Excel
- **File:** `frontend/src/components/bmn-asset-management.tsx:285`

#### `GET assets/search/by-code-nup?asset_code=${code}&asset_nup=${nup}`
Cari aset berdasarkan kode dan NUP (untuk pembuatan tiket)
- **File:** `frontend/src/components/views/shared/kartu-kendali-form.tsx:54`

---

### Manajemen Tiket

#### `GET tickets-counts${query}`
Mendapatkan jumlah tiket per status
- **File:** `frontend/src/lib/storage.ts:305`

#### `POST tickets`
Membuat tiket baru (perbaikan atau zoom meeting)
- **File:** `frontend/src/components/views/dashboards/user-dashboard.tsx:227`

#### `PATCH tickets/${ticketId}`
Update data tiket (title, description, form_data)
- **Files:**
  - `frontend/src/components/views/work-orders/work-order-form.tsx:221`
  - `frontend/src/components/views/work-orders/work-order-form.tsx:273`

#### `PATCH tickets/${ticketId}/status`
Update status tiket
- **Files:**
  - `frontend/src/components/views/tickets/ticket-detail.tsx:304`
  - `frontend/src/components/views/work-orders/work-order-form.tsx:232`

#### `PATCH tickets/${ticketId}/approve`
Approve tiket perbaikan (Admin Layanan)
- **File:** `frontend/src/components/views/tickets/ticket-detail.tsx:206`

#### `PATCH tickets/${ticketId}/assign`
Assign tiket ke teknisi
- **File:** `frontend/src/components/views/tickets/ticket-detail.tsx:253`

#### `PUT tickets`
Bulk update tickets (cache management)
- **File:** `frontend/src/lib/storage.ts:507`

---

### Diagnosis Tiket

#### `GET /tickets/${ticketId}/diagnosis`
Mendapatkan diagnosis tiket perbaikan
- **File:** `frontend/src/components/views/tickets/ticket-diagnosis-form.tsx:95`

#### `POST tickets/${ticketId}/diagnosis`
Membuat/update diagnosis tiket (Teknisi)
- **File:** `frontend/src/components/views/tickets/ticket-diagnosis-form.tsx:191`

---

### Feedback Tiket

#### `POST tickets/${ticketId}/feedback`
Memberikan feedback dan rating untuk tiket selesai
- **File:** `frontend/src/components/views/tickets/feedback-modal.tsx:44`

---

### Zoom Meeting Management

#### `GET zoom/accounts`
Mendapatkan daftar akun zoom yang tersedia
- **Files:**
  - `frontend/src/components/views/zoom/zoom-admin-grid.tsx:220`
  - `frontend/src/components/views/zoom/zoom-admin-review-modal.tsx:182`
  - `frontend/src/components/views/zoom/zoom-booking.tsx:337`
  - `frontend/src/components/views/zoom/zoom-monthly-calendar.tsx:90`

#### `POST zoom/accounts`
Membuat akun zoom baru (Admin)
- **File:** `frontend/src/components/views/zoom/zoom-account-management.tsx:171`

#### `PUT zoom/accounts/${id}`
Update akun zoom
- **Files:**
  - `frontend/src/components/views/zoom/zoom-account-management.tsx:187`
  - `frontend/src/components/views/zoom/zoom-account-management.tsx:233`

#### `DELETE zoom/accounts/${id}`
Hapus akun zoom
- **File:** `frontend/src/components/views/zoom/zoom-account-management.tsx:300`

#### `PATCH tickets/${bookingId}/approve-zoom`
Approve booking zoom meeting (Admin Layanan)
- **File:** `frontend/src/components/views/zoom/zoom-admin-review-modal.tsx:341`

#### `PATCH tickets/${bookingId}/reject-zoom`
Reject booking zoom meeting (Admin Layanan)
- **File:** `frontend/src/components/views/zoom/zoom-admin-review-modal.tsx:371`

#### `GET tickets/calendar/grid?${params}`
Mendapatkan data kalender zoom bookings (daily/weekly/monthly)
- **File:** `frontend/src/components/views/zoom/zoom-admin-grid.tsx:306`

#### `GET tickets?type=zoom_meeting&meeting_date=${date}`
Mendapatkan zoom bookings untuk tanggal tertentu
- **File:** `frontend/src/components/views/zoom/zoom-admin-review-modal.tsx:224`

---

### Work Orders

#### `GET /tickets/${ticketId}/work-orders`
Mendapatkan work orders untuk tiket tertentu
- **File:** `frontend/src/components/views/work-orders/work-order-form.tsx:81`

#### `POST work-orders`
Membuat work order baru (sparepart/vendor/license)
- **Files:**
  - `frontend/src/components/views/work-orders/work-order-form.tsx:217`
  - `frontend/src/lib/storage.ts:701`

#### `PUT work-orders`
Bulk update work orders (cache management)
- **File:** `frontend/src/lib/storage.ts:662`

#### `PUT work-orders/${id}`
Update work order individual
- **File:** `frontend/src/lib/storage.ts:723`

#### `PATCH work-orders/${id}/status`
Update status work order (requested/in_procurement/completed/unsuccessful)
- **File:** `frontend/src/components/views/work-orders/work-order-list.tsx:312`

#### `PATCH work-orders/${id}/change-bmn-condition`
Ubah kondisi BMN setelah work order gagal
- **File:** `frontend/src/components/views/work-orders/work-order-form.tsx:309`

#### `GET work-orders?status=completed&per_page=100`
Mendapatkan work orders yang sudah selesai (untuk kartu kendali)
- **File:** `frontend/src/components/views/admin/admin-penyedia-kartu-kendali.tsx:45`

---

### Kartu Kendali

#### `GET kartu-kendali?${params}`
Mendapatkan list kartu kendali dengan filtering
- **File:** `frontend/src/components/views/shared/kartu-kendali-list.tsx:77`

#### `GET kartu-kendali/${ticketId}`
Mendapatkan detail kartu kendali untuk 1 tiket
- **File:** `frontend/src/components/views/shared/kartu-kendali-detail.tsx:220`

#### `POST kartu-kendali/from-work-order`
Membuat kartu kendali dari work order
- **File:** `frontend/src/components/views/shared/kartu-kendali-form.tsx:86`

#### `PUT kartu-kendali`
Bulk update kartu kendali (cache management)
- **File:** `frontend/src/lib/storage.ts:752`

---

### Notifikasi

#### `PATCH /notifications/${id}/read`
Tandai notifikasi sebagai sudah dibaca
- **File:** `frontend/src/hooks/use-notifications.ts:103`

#### `PATCH /notifications/read-all`
Tandai semua notifikasi sebagai sudah dibaca
- **File:** `frontend/src/hooks/use-notifications.ts:115`

#### `POST notifications`
Membuat notifikasi baru (cache management)
- **File:** `frontend/src/lib/storage.ts:570`

#### `PUT notifications`
Bulk update notifikasi (cache management)
- **File:** `frontend/src/lib/storage.ts:550`

---

### User Management

#### `GET users?search=${query}`
Cari user berdasarkan nama/email (untuk co-host zoom)
- **File:** `frontend/src/components/views/dashboards/user-dashboard.tsx:140`

#### `PUT users`
Bulk update users (cache management)
- **File:** `frontend/src/lib/storage.ts:417`

---

### Audit Logs

#### `POST audit-logs`
Membuat log audit activity
- **File:** `frontend/src/lib/storage.ts:529`

---

### Dashboard & Statistik

#### `GET /tickets/stats/super-admin-dashboard`
Mendapatkan statistik lengkap untuk super admin
- **File:** `frontend/src/hooks/use-super-admin-dashboard.ts:61`

---

## 🔍 Cara Menggunakan Script Ekstraksi

### 1. Ekstrak API Calls

```bash
# Jalankan script
node extract-api-calls.js

# Output:
# - Terminal: Ringkasan API calls
# - File JSON: frontend-api-calls.json (detail lengkap)
```

### 2. Format Output JSON

File `frontend-api-calls.json` berisi:

```json
{
  "summary": {
    "totalCalls": 120,
    "uniqueEndpoints": 49,
    "totalFiles": 22,
    "methodStats": {
      "GET": 32,
      "POST": 28,
      "PUT": 18,
      "PATCH": 38,
      "DELETE": 4
    },
    "generatedAt": "2025-12-15T..."
  },
  "groupedByEndpoint": {
    "GET /bmn-assets?${params}": [
      {
        "method": "GET",
        "endpoint": "/bmn-assets?${params}",
        "file": "frontend/src/...",
        "line": 100,
        "context": "..."
      }
    ]
  },
  "allCalls": [...],
  "fileMap": {...}
}
```

### 3. Grep Manual (Alternatif)

Jika ingin mencari API call tertentu:

```bash
# Cari semua GET requests
grep -r "api.get(" frontend/src --include="*.tsx" --include="*.ts"

# Cari endpoint tertentu
grep -r "tickets" frontend/src --include="*.tsx" | grep "api\."

# Cari berdasarkan method
grep -r "api.post\|api.put\|api.patch" frontend/src --include="*.tsx"
```

---

## 📝 Catatan Penting

1. **Template Strings:** Banyak endpoint menggunakan template strings (backticks) dengan variabel, misal:
   - `` `tickets/${ticketId}/diagnosis` ``
   - `` `work-orders/${id}/status` ``

2. **Query Parameters:** Beberapa endpoint menggunakan URLSearchParams:
   - `kartu-kendali?${params.toString()}`
   - `tickets?type=zoom_meeting&meeting_date=${date}`

3. **Cache Management:** File `storage.ts` berisi helper functions untuk:
   - Local state management
   - Sync dengan backend API
   - Optimistic updates

4. **File Utama yang Menggunakan API:**
   - `lib/storage.ts` - State management & cache sync
   - `components/bmn-asset-management.tsx` - Manajemen aset
   - `components/views/tickets/*` - Manajemen tiket
   - `components/views/zoom/*` - Zoom management
   - `components/views/work-orders/*` - Work order management
   - `hooks/use-notifications.ts` - Notifikasi real-time

5. **Pattern Umum:**
   ```typescript
   // GET request
   const data = await api.get('/endpoint');
   
   // POST request
   await api.post('/endpoint', { data });
   
   // PUT request
   await api.put('/endpoint', { data });
   
   // PATCH request
   await api.patch('/endpoint', { data });
   
   // DELETE request
   await api.delete('/endpoint');
   ```

---

## 🛠️ Tools yang Tersedia

1. **extract-api-calls.js** - Script Node.js untuk ekstraksi otomatis
2. **frontend-api-calls.json** - Output JSON dengan detail lengkap
3. **FRONTEND_API_CALLS.md** - Dokumentasi ini

---

**Update terakhir:** 15 Desember 2025
