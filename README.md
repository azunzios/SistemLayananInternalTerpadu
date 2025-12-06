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

