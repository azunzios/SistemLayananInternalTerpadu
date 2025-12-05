# Email Notification System

## Overview
Sistem notifikasi email otomatis untuk setiap event di aplikasi SIGAP-TI BPS NTB.

## Fitur
✅ **11 Jenis Notifikasi Email:**
1. Tiket baru dibuat → admin_layanan
2. Tiket di-assign → teknisi & pelapor
3. Status tiket berubah → pelapor (& admin_penyedia jika on_hold)
4. Zoom disetujui → pelapor
5. Zoom ditolak → pelapor
6. Tiket selesai → pelapor
7. Work Order dibuat → admin_penyedia
8. Work Order status berubah → teknisi (& pelapor jika completed)
9. Semua Work Order selesai → teknisi
10. Diagnosis dibuat → pelapor (& admin_layanan jika butuh pengadaan)
11. Komentar baru → pihak terkait

## Email Template
- **Design:** Modern & responsive dengan gradient header
- **Badge:** Color-coded berdasarkan tipe (info/success/warning/error)
- **Action Button:** Direct link ke detail tiket
- **Footer:** Informasi BPS NTB & link ke aplikasi

## Konfigurasi

### 1. Setup Gmail SMTP (Recommended)
Ikuti panduan lengkap di `GMAIL_SMTP_SETUP.md`

**Quick Setup:**
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

### 2. Testing Email Configuration

#### Test 1: Kirim Test Email Sederhana
```bash
cd backend
php artisan tinker
```

```php
Mail::raw('Test email dari SIGAP-TI', function ($message) {
    $message->to('your-email@example.com')
            ->subject('Test Email');
});
```

#### Test 2: Test Notification Email
```php
$user = User::find(1); // Ganti dengan user ID yang valid
$notification = \App\Models\Notification::create([
    'user_id' => $user->id,
    'title' => 'Test Notifikasi',
    'message' => 'Ini adalah test notifikasi email',
    'type' => 'info',
    'reference_type' => 'ticket',
    'reference_id' => 1,
]);

Mail::to($user->email)->send(new \App\Mail\NotificationMail($user, $notification));
```

#### Test 3: Test via Route (Create Ticket)
Cara paling realistis: buat tiket baru melalui aplikasi, cek apakah email terkirim ke admin_layanan.

## Error Handling

### Email Gagal Dikirim
- Notifikasi tetap tersimpan di database
- Error di-log ke `storage/logs/laravel.log`
- User tetap bisa lihat notifikasi di aplikasi

### Check Logs
```bash
# Real-time monitoring
tail -f backend/storage/logs/laravel.log

# Cari error email
grep "Failed to send notification email" backend/storage/logs/laravel.log
```

## Troubleshooting

### Email Tidak Terkirim

**1. Cek Konfigurasi:**
```bash
php artisan config:clear
php artisan config:cache
```

**2. Cek Koneksi SMTP:**
```bash
php artisan tinker
```
```php
try {
    Mail::raw('Test', function($m) { $m->to('test@example.com')->subject('Test'); });
    echo "Success!";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
```

**3. Common Issues:**

| Error | Solusi |
|-------|--------|
| "Connection refused" | Cek MAIL_HOST & MAIL_PORT |
| "Username/Password failed" | Regenerate App Password di Gmail |
| "Unauthenticated" | Pastikan 2FA aktif & gunakan App Password |
| "Connection timeout" | Cek firewall/antivirus, atau coba port 465 dengan ssl |

### Gmail App Password Bermasalah
1. Revoke app password lama
2. Generate app password baru
3. Update MAIL_PASSWORD di .env
4. Clear config: `php artisan config:clear`

## Production Setup

### 1. Gunakan Queue untuk Performa
Update `.env`:
```env
QUEUE_CONNECTION=database
```

Migrate queue table:
```bash
php artisan queue:table
php artisan migrate
```

Update `TicketNotificationService.php`:
```php
// Di method createNotificationWithEmail, ganti:
Mail::to($user->email)->send(new NotificationMail($user, $notification));

// Menjadi:
Mail::to($user->email)->queue(new NotificationMail($user, $notification));
```

Start queue worker:
```bash
php artisan queue:work
```

### 2. Monitor Email Sending
Setup supervisor untuk queue worker (production):
```bash
sudo apt install supervisor
```

Config file: `/etc/supervisor/conf.d/sigapti-worker.conf`
```ini
[program:sigapti-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/storage/logs/worker.log
```

### 3. Rate Limiting (Gmail: 500 email/day)
Untuk aplikasi dengan traffic tinggi, pertimbangkan:
- **SendGrid** (100 email/day free, kemudian berbayar)
- **Mailgun** (5000 email/month free)
- **Amazon SES** (Pay as you go)

## Customization

### 1. Custom Email Template
Edit: `backend/resources/views/emails/notification.blade.php`

### 2. Tambah Data ke Email
Update `NotificationMail.php`:
```php
public $customData;

public function __construct(User $user, Notification $notification, $customData = null)
{
    // ... existing code
    $this->customData = $customData;
}
```

### 3. Disable Email untuk Testing
Di `.env`:
```env
MAIL_MAILER=log  # Email akan di-log ke storage/logs/laravel.log
```

## Architecture

```
Event (Ticket Created/Updated)
    ↓
Controller calls TicketNotificationService::onXxxEvent()
    ↓
createNotificationWithEmail() method
    ↓ (parallel)
    ├─→ Save to Database (Notification model)
    └─→ Send Email (NotificationMail)
            ↓
        Email Template (notification.blade.php)
            ↓
        SMTP Server (Gmail)
            ↓
        User's Email Inbox
```

## Security Notes
1. **Never commit** MAIL_PASSWORD ke git
2. Gunakan **App Password**, bukan password Gmail asli
3. Aktifkan **2FA** di akun Gmail
4. Untuk production, gunakan **dedicated email service**

## Performance Tips
1. Gunakan **queue** untuk email (async)
2. Batch notification jika banyak user
3. Rate limit email sending
4. Monitor email bounce/failed delivery

---

**Created:** December 2025  
**Last Updated:** December 5, 2025  
**Maintained by:** IT BPS NTB
