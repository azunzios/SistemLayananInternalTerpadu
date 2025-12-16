perubahan cukup banyak, mungkin kamu bisa hapus dulu file seluruhnya yang ada di local apabila ada konflik. 

copy repository ini

## 🚀 Installation

### 1) Install Backend
Di folder root

```bash
cd backend
composer install
cp .env.example .env  # Copy environment file
php artisan key:generate
php artisan migrate --seed
php artisan serve 
```

**Setup Email Notification (Optional):**
Lihat dokumentasi lengkap: `GMAIL_SMTP_SETUP.md` dan `EMAIL_NOTIFICATION_SYSTEM.md`

Quick setup - edit `backend/.env`:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=sigapti@gmail.com
MAIL_PASSWORD=your-16-digit-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=sigapti@gmail.com
MAIL_FROM_NAME="SIGAPTI BPS NTB"

FRONTEND_URL=http://localhost:5173
```

Test email:
```bash
php artisan test:email-notification your-email@example.com
```

### 2) Install Frontend
Di folder root

```bash
cd frontend
npm install
npm run dev
```

Buat file: `env.local` di folder frontend isinya:

```
# Backend API Configuration
# URL ke Laravel backend

# API Base URL - Laravel backend running di port 8000
VITE_API=http://localhost:8000/api

# API Timeout (ms) - Optional
VITE_API_TIMEOUT=30000
```

## 📧 Email Notification Features

**11 Notifikasi Otomatis:**
- Tiket baru dibuat
- Tiket di-assign
- Status tiket berubah
- Zoom disetujui/ditolak
- Tiket selesai
- Work Order dibuat/update
- Diagnosis selesai
- Komentar baru

**Dokumentasi lengkap:** `EMAIL_NOTIFICATION_SYSTEM.md`

---

## 📚 Dokumentasi API

### 1. Dokumentasi API Backend (Bahasa Indonesia)
File lengkap: [docs/API_DOCUMENTATION_ID.md](docs/API_DOCUMENTATION_ID.md)

**Isi:**
- 100+ endpoint dengan detail lengkap
- Request/Response examples
- Validasi field
- Status codes & error handling
- Enum values untuk semua opsi
- Kategori: Auth, Users, Tickets, Assets, Zoom, Work Orders, dll

### 2. Ekstrak API Calls dari Frontend

**Quick Start:**
```bash
# Jalankan script ekstraksi otomatis
node extract-api-calls.js

# Output:
# - Terminal: Ringkasan 120 API calls
# - File JSON: frontend-api-calls.json (detail lengkap)
```

**Dokumentasi:**
- [docs/FRONTEND_API_CALLS.md](docs/FRONTEND_API_CALLS.md) - Daftar semua API calls frontend
- [docs/API_EXTRACTION_GUIDE.md](docs/API_EXTRACTION_GUIDE.md) - Panduan lengkap ekstraksi

**Cara Alternatif:**
```bash
# Grep manual - cari endpoint tertentu
grep -r "api.get\|api.post" frontend/src --include="*.tsx" -n

# Cari endpoint spesifik
grep -r "tickets" frontend/src --include="*.tsx" | grep "api\."
```

**Statistik API Calls:**
- Total: 120 calls
- Unique endpoints: 49
- GET: 32 | POST: 28 | PATCH: 38 | PUT: 18 | DELETE: 4

### 3. OpenAPI Specification (Backend)
File: [docs/api_docs.yaml](docs/api_docs.yaml)
- Format: OpenAPI 3.0
- Auto-generated via Laravel Scribe
- Update dengan: `php artisan scribe:generate`

---

## 🛠️ Tech Stack

**Quick Reference:**
- Laravel 12.38.1, React 19.2.1, MySQL 8.0.44
- PHP 8.3.6, Node.js 24.11.1, TypeScript 5.9.3
- Vite 7.2.2, Tailwind CSS 4.1.17

**Dokumentasi Lengkap:** [docs/TECH_STACK.md](docs/TECH_STACK.md)

**Key Dependencies:**
- Backend: Sanctum (Auth), PHPSpreadsheet (Excel), Scribe (API Docs), PestPHP (Testing)
- Frontend: Radix UI (26 components), React Hook Form, Recharts, Lucide Icons

