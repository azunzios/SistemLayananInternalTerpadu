# Email System Testing Guide

## 📧 Email Configuration

Sistem SIGAP-TI mendukung 2 metode pengiriman email:

### 1. Mailtrap API (Development/Testing)
```bash
MAIL_DRIVER=mailtrap
MAILTRAP_API_TOKEN=your_api_token_here
MAIL_FROM_ADDRESS=hello@sigapti.azify.page
MAIL_FROM_NAME="SIGAP-TI BPS NTB"
```

### 2. Gmail SMTP (Production)
```bash
MAIL_DRIVER=smtp
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_gmail@gmail.com
MAIL_PASSWORD=your_16_digit_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your_gmail@gmail.com
MAIL_FROM_NAME="SIGAP-TI BPS NTB"
```

## 🔧 Setup Mailtrap API

1. **Buat Akun Mailtrap**
   - Kunjungi: https://mailtrap.io
   - Daftar akun gratis

2. **Dapatkan API Token**
   - Login ke dashboard
   - Pergi ke: https://mailtrap.io/api-tokens
   - Generate new API token
   - Copy token

3. **Update .env**
   ```bash
   MAIL_DRIVER=mailtrap
   MAILTRAP_API_TOKEN=paste_your_token_here
   ```

## 🧪 Testing Commands

### 1. Test Basic Email (Mailtrap API Direct)
```bash
php artisan send-test-mail
```
- Mengirim email sederhana untuk verifikasi Mailtrap API
- Tidak memerlukan data user

### 2. Test Reset Password Email
```bash
php artisan test-reset-password-email user@example.com
```
- Mengirim email reset password
- Memerlukan email user yang ada di database
- Menampilkan reset URL dengan token

**Template:** `resources/views/emails/reset-password.blade.php`

### 3. Test New User Email
```bash
php artisan test-new-user-email user@example.com
```
- Mengirim email welcome untuk user baru
- Memerlukan email user yang ada di database
- Menampilkan password default (test)

**Template:** `resources/views/emails/new-user.blade.php`

### 4. Test Notification Email
```bash
php artisan test-notification-email user@example.com
```
- Mengirim email notifikasi
- Memerlukan email user yang ada di database
- Otomatis membuat dan menghapus test notification

**Template:** `resources/views/emails/notification.blade.php`

## 📝 Email Templates

### 1. Reset Password Email
**File:** `app/Mail/ResetPasswordMail.php`
**View:** `resources/views/emails/reset-password.blade.php`

**Features:**
- Link reset password dengan token
- Expiry info (1 jam)
- Warning jika tidak request reset
- Responsive design

### 2. New User Email
**File:** `app/Mail/NewUserMail.php`
**View:** `resources/views/emails/new-user.blade.php`

**Features:**
- Email dan password default
- Instruksi login
- Instruksi ganti password
- Security notice

### 3. Notification Email
**File:** `app/Mail/NotificationMail.php`
**View:** `resources/views/emails/notification.blade.php`

**Features:**
- Detail notifikasi
- Info tiket (jika ada)
- Info asset BMN (jika ada)
- Link ke detail
- Responsive design

## 🔍 Troubleshooting

### Error: "MAILTRAP_API_TOKEN not configured"
**Solusi:**
1. Pastikan `.env` memiliki `MAILTRAP_API_TOKEN`
2. Token tidak boleh `your_mailtrap_api_token_here`
3. Restart server setelah update `.env`

### Error: "User not found"
**Solusi:**
1. Pastikan email user ada di database
2. Cek dengan: `php artisan tinker` → `User::where('email', 'user@example.com')->first()`

### Email tidak dikirim
**Solusi:**
1. Cek `MAIL_DRIVER` di `.env` (mailtrap atau smtp)
2. Jika mailtrap, pastikan API token valid
3. Cek log: `storage/logs/laravel.log`
4. Test koneksi dengan: `php artisan send-test-mail`

### Gmail SMTP Error: "Invalid credentials"
**Solusi:**
1. Aktifkan 2FA di akun Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Gunakan 16-digit app password (bukan password Gmail biasa)

## 📊 Mailtrap Dashboard

Setelah mengirim email via Mailtrap:
1. Login ke https://mailtrap.io
2. Buka "Email Testing" → "Inbox"
3. Lihat semua email yang dikirim
4. Preview HTML/Text version
5. Check spam score
6. Validate email content

## 🚀 Production Deployment

Untuk production, switch ke Gmail SMTP:

```bash
# .env production
MAIL_DRIVER=smtp
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=sigapti@bpsnusatenggarabarat.id
MAIL_PASSWORD=your_gmail_app_password_here
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=sigapti@bpsnusatenggarabarat.id
MAIL_FROM_NAME="SIGAP-TI BPS NTB"
```

## 📧 Email Categories (Mailtrap)

Semua email dikategorikan untuk tracking:
- **Password Reset** - Reset password emails
- **New User Registration** - Welcome emails
- **Notification** - System notifications
- **Test** - Test emails

## 🔐 Security Notes

1. **Jangan commit** `.env` ke repository
2. **Jangan share** API token atau Gmail password
3. **Rotate** API token secara berkala
4. **Monitor** email logs untuk suspicious activity
5. **Validate** email addresses sebelum kirim

## 📚 Additional Resources

- Laravel Mail Documentation: https://laravel.com/docs/mail
- Mailtrap Documentation: https://api-docs.mailtrap.io/
- Gmail SMTP Setup: https://support.google.com/mail/answer/7126229

---

Last Updated: December 11, 2025
