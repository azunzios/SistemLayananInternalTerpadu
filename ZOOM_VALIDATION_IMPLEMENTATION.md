# Implementasi Validasi Booking Zoom

## Overview
Implementasi validasi besar-besaran untuk proses booking zoom dengan fitur-fitur berikut:

### 1. Validasi Slot Kosong dengan Irisan Waktu
- Zoom dapat dipinjam selama masih ada slot kosong pada akun yang tersedia
- Sistem mengecek irisan waktu (overlap) antar booking
- Jika ada konflik, sistem otomatis mencari akun lain yang tersedia
- Prioritas pemilihan akun: yang memiliki paling sedikit booking di hari tersebut

### 2. Kebebasan Admin Memilih Akun Zoom
- Admin layanan dapat memilih akun zoom mana saja saat approve
- Sistem memberikan saran akun (suggested account) dari auto-assign
- Admin bebas mengubah ke akun lain jika diperlukan
- Validasi konflik dilakukan real-time saat admin memilih akun

### 3. Validasi Field yang Dibebaskan
- **Jumlah peserta**: Tidak ada validasi min/max, dibebaskan
- **Breakout room**: Tidak ada validasi, dibebaskan
- Field ini tetap ada untuk informasi tambahan

### 4. Upload File Pendukung
- Support upload file pendukung untuk booking zoom
- Format yang didukung: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, JPEG, PNG
- Maksimal 5 file per booking
- Maksimal 10MB per file
- Disimpan di: `storage/app/public/zoom_attachments/`
- Konfigurasi path di `.env`: `ZOOM_ATTACHMENTS_PATH`

### 5. Suggested Account untuk Admin
- Saat booking dibuat, sistem auto-assign ke akun yang tersedia
- Akun ini menjadi "suggested account" untuk admin
- Admin dapat melihat rekomendasi ini saat review
- Zoom account dapat berubah (update) saat approve jika admin memilih akun lain

## Perubahan Backend

### Database
1. **Migration Baru**: `2025_11_21_034318_add_zoom_attachments_to_tickets_table.php`
   - Menambahkan kolom `zoom_attachments` (JSON) untuk menyimpan metadata file

2. **Update Migration**: `2025_11_18_160000_create_tickets_table.php`
   - Ditambahkan kolom `zoom_attachments`

### Models
1. **Ticket.php**
   - Ditambahkan `zoom_attachments` ke `$fillable`
   - Ditambahkan `zoom_attachments` ke `$casts` sebagai array
   - Updated comment untuk `zoom_account_id` (database ID, bukan account_id string)

2. **ZoomAccount.php**
   - Method `isAvailableAt()` sudah support overlap detection
   - Menggunakan database ID untuk relationship

### Services
1. **ZoomBookingService.php**
   - `validateAndAssignAccount()`: Return value ditambahkan `suggested_account_id`
   - `findAvailableAccount()`: Prioritas ke akun dengan paling sedikit booking
   - `hasConflict()`: Updated untuk gunakan database ID
   - `getConflicts()`: Updated untuk gunakan database ID
   - Semua fungsi sudah normalize status ke `pending_review` dan `approved` saja

### Controllers
1. **TicketController.php**
   - `store()`: 
     - Validasi file upload untuk `zoom_attachments`
     - Support multipart/form-data
     - Handle file upload ke storage
     - Participants & breakout_rooms tidak wajib (nullable)
   
   - `approveZoom()`:
     - Validasi konflik sebelum approve
     - Log perubahan akun zoom di timeline
     - Admin bebas pilih akun zoom

### Resources
1. **TicketResource.php**
   - Ditambahkan field `attachments` untuk zoom tickets
   - Return array metadata file (name, path, size, type, url)

### Configuration
1. **.env**
   ```
   ZOOM_ATTACHMENTS_PATH=zoom_attachments
   MAX_ZOOM_ATTACHMENT_SIZE=10240
   ```

2. **config/filesystems.php**
   - Ditambahkan disk `zoom_attachments`
   - Root: `storage/app/public/zoom_attachments`
   - Visibility: public

## Perubahan Frontend

### Types
1. **index.ts**
   - Interface `ZoomTicket` ditambahkan field `suggestedAccountId`
   - Support untuk menampilkan akun yang disarankan

### Components

1. **QuickBookingDialog.tsx**
   - Ditambahkan props `attachments` dan `onAttachmentsChange`
   - File input support multiple files
   - Preview file yang diupload dengan ukuran
   - Validasi file size (10MB) dan jumlah (max 5)
   - Format file yang didukung ditampilkan di UI

2. **zoom-booking.tsx**
   - State baru: `attachments: File[]`
   - `resetQuickBookingState()`: Clear attachments
   - `handleSubmitQuickBooking()`: 
     - Menggunakan FormData untuk kirim file
     - Native fetch API (bukan axios) untuk support FormData
     - Participants & breakout rooms boleh kosong
   - Props `attachments` dan `onAttachmentsChange` diteruskan ke dialog

3. **zoom-admin-review-modal.tsx**
   - Auto-select suggested account dari booking
   - Display suggested account info
   - Conflict warning jika admin pilih akun yang bentrok
   - Timeline mencatat perubahan akun zoom

4. **zoom-admin-grid.tsx**
   - Display booking di grid sesuai akun yang dipilih admin
   - Support real-time update saat akun berubah

## Flow Proses Booking

### 1. Pegawai Membuat Booking
```
[Pegawai] → Fill form + upload files
          ↓
[Frontend] → FormData dengan files
          ↓
[Backend] → Validate time overlap
          → Find available account (prioritas: least bookings)
          → Save files to storage
          → Auto-assign account (suggested)
          → Status: pending_review
```

### 2. Admin Review Booking
```
[Admin] → Open review modal
        → See suggested account (dari auto-assign)
        → Can change to other account
        ↓
[Backend] → Validate conflict jika ganti akun
          → Return error jika bentrok
          → Allow jika tidak bentrok
        ↓
[Admin] → Approve dengan akun pilihan
        → Status: approved
        → Timeline log perubahan akun (jika berubah)
```

### 3. Validasi Slot Kosong
```
Request: date + start_time + end_time
         ↓
[Service] → Get all active accounts
          → For each account:
             - Check overlap dengan bookings lain
             - Count bookings di hari tersebut
          → Sort by booking count (ASC)
          → Return account dengan paling sedikit booking
```

## Validasi Rules

### Waktu
- ✅ Start time < End time
- ✅ Date >= today
- ✅ Tidak boleh masa lalu
- ✅ Overlap detection antar booking

### File Upload
- ✅ Max 5 files
- ✅ Max 10MB per file
- ✅ Format: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, JPEG, PNG
- ❌ Tidak wajib (optional)

### Field Bebas
- Participants: Min 0, informasi saja
- Breakout Rooms: Min 0, informasi saja

## Storage Structure
```
storage/
└── app/
    └── public/
        ├── zoom_attachments/
        │   ├── 1637481234_abc123_proposal.pdf
        │   ├── 1637481235_def456_agenda.docx
        │   └── ...
        └── ...

public/
└── storage/ (symlink ke storage/app/public)
```

## API Endpoints

### POST /api/tickets (Multipart/Form-Data)
```
Content-Type: multipart/form-data

Fields:
- type: "zoom_meeting"
- title: string
- description: string
- zoom_date: "YYYY-MM-DD"
- zoom_start_time: "HH:mm"
- zoom_end_time: "HH:mm"
- zoom_estimated_participants: number (optional)
- zoom_breakout_rooms: number (optional)
- zoom_co_hosts: JSON string
- zoom_attachments[]: File[] (optional, max 5)

Response:
{
  "data": {
    "id": 123,
    "zoomAccountId": 2,
    "suggestedAccountId": 2,
    "attachments": [
      {
        "name": "proposal.pdf",
        "path": "1637481234_abc123_proposal.pdf",
        "size": 245678,
        "type": "application/pdf",
        "url": "http://localhost:8000/storage/zoom_attachments/1637481234_abc123_proposal.pdf"
      }
    ],
    ...
  }
}
```

### POST /api/tickets/{id}/zoom/approve
```json
{
  "zoom_meeting_link": "https://zoom.us/j/123456789",
  "zoom_meeting_id": "123456789",
  "zoom_passcode": "abc123",
  "zoom_account_id": 3  // Admin bebas pilih akun
}

Error if conflict:
{
  "message": "Akun zoom yang dipilih bentrok dengan booking lain",
  "conflicts": [
    {
      "ticket_number": "Z-20251121-001",
      "user_name": "John Doe",
      "title": "Meeting Penting",
      "start_time": "09:00",
      "end_time": "11:00",
      "status": "approved"
    }
  ]
}
```

## Testing Checklist

### Backend
- [ ] Upload file < 10MB berhasil
- [ ] Upload file > 10MB ditolak
- [ ] Upload > 5 files ditolak
- [ ] Format file tidak valid ditolak
- [ ] Participants boleh kosong atau 0
- [ ] Breakout rooms boleh kosong atau 0
- [ ] Auto-assign ke akun dengan least bookings
- [ ] Conflict detection bekerja
- [ ] Admin bisa pilih akun lain saat approve
- [ ] Error jika admin pilih akun yang bentrok
- [ ] Timeline log perubahan akun

### Frontend
- [ ] File input support multiple
- [ ] Preview file dengan size
- [ ] Remove file dari list
- [ ] Max 5 files enforced
- [ ] Suggested account ditampilkan
- [ ] Conflict warning muncul
- [ ] FormData kirim file dengan benar
- [ ] Participants optional (tidak error jika kosong)
- [ ] Breakout rooms optional

## Notes
- Semua validasi zoom menggunakan status: `pending_review` dan `approved`
- Status lama seperti `menunggu_review`, `pending_approval` sudah tidak digunakan
- Zoom account menggunakan database ID (integer), bukan account_id (string)
- File disimpan dengan pattern: `{timestamp}_{uniqid}_{original_name}`
- URL file accessible via: `/storage/zoom_attachments/{filename}`
