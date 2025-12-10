# Konfigurasi Email SIGAP-TI

Sistem SIGAP-TI mendukung dua metode pengiriman email yang dapat dikonfigurasi melalui file `.env`:

1. **Mailtrap API** - untuk testing/development
2. **Gmail SMTP** - untuk production

## Daftar Email yang Dikirim Sistem

### 1. Email User Baru (NewUserMail)
- **Trigger**: Admin membuat user baru di User Management
- **Konten**: Email dan password default
- **Subject**: "Akun Baru SIGAP-TI BPS NTB"
- **Template**: `resources/views/emails/new-user.blade.php`

### 2. Email Reset Password (ResetPasswordMail)
- **Trigger**: User klik "Lupa Password"
- **Konten**: Link reset password (expired 1 jam)
- **Subject**: "Reset Password - SIGAP-TI BPS NTB"
- **Template**: `resources/views/emails/reset-password.blade.php`

### 3. Email Notifikasi (NotificationMail)
- **Trigger**: Aktivitas pada ticket (assign, update, dll)
- **Konten**: Detail notifikasi dan link ke ticket
- **Subject**: "[Judul Notifikasi] - SIGAP-TI BPS NTB"
- **Template**: `resources/views/emails/notification.blade.php`

---

## Opsi 1: Mailtrap API (Development/Testing)

### Kelebihan
- Tidak perlu email sungguhan
- Email tidak terkirim ke user (aman untuk testing)
- Bisa preview email dengan tampilan sempurna
- Gratis untuk development

### Langkah Setup

#### 1. Daftar Mailtrap
1. Buka: https://mailtrap.io
2. Sign up (gratis, tidak perlu kartu kredit)
3. Login ke dashboard

#### 2. Dapatkan API Token
1. Klik menu **Sending Domains** atau **Email API**
2. Pilih atau buat domain (bisa pakai domain gratis dari Mailtrap)
3. Copy **API Token** (contoh: `16e66628248aed91c34aadbcbb97c81c`)

#### 3. Konfigurasi .env

```env
# Mail Driver - set to 'mailtrap' for Mailtrap API
MAIL_DRIVER=mailtrap

# Mailtrap API Configuration
MAILTRAP_API_TOKEN=16e66628248aed91c34aadbcbb97c81c
MAIL_FROM_ADDRESS=hello@sigapti.azify.page
MAIL_FROM_NAME="SIGAP-TI BPS NTB"

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### 4. Clear Cache & Test

```bash
php artisan config:clear
php artisan cache:clear
```

Lalu test dengan membuat user baru atau reset password. Cek email di inbox Mailtrap.io.

---

## Opsi 2: Gmail SMTP (Production)

### Kelebihan
- Email sungguhan terkirim ke user
- Gratis (dengan batasan 500 email/hari)
- Reliable dan trusted email provider

### Langkah Setup

#### 1. Aktifkan 2-Factor Authentication (2FA)

1. Buka [Google Account Security](https://myaccount.google.com/security)
2. Login dengan akun Gmail yang akan digunakan (contoh: `sigapti@gmail.com`)
3. Di bagian "Signing in to Google", aktifkan **2-Step Verification**
4. Ikuti instruksi untuk setup (biasanya dengan nomor HP)

#### 2. Generate App Password

1. Setelah 2FA aktif, kembali ke [Google Account Security](https://myaccount.google.com/security)
2. Di bagian "Signing in to Google", klik **App passwords**
3. Klik **Select app** → pilih **Mail**
4. Klik **Select device** → pilih **Other (Custom name)**
5. Ketik nama: **SIGAPTI Laravel**
6. Klik **Generate**
7. Google akan menampilkan **16-digit password**, contoh: `abcd efgh ijkl mnop`
8. **COPY password ini** (tanpa spasi, tanpa Enter, jadi 16 karakter)

#### 3. Konfigurasi .env

```env
# Mail Driver - set to 'smtp' for Gmail
MAIL_DRIVER=smtp

# Gmail SMTP Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=sigapti@gmail.com
MAIL_PASSWORD=abcdefghijklmnop    # <-- Paste 16-digit App Password (TANPA SPASI)
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=sigapti@gmail.com
MAIL_FROM_NAME="SIGAP-TI BPS NTB"

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**PENTING**: 
- Gunakan **App Password**, bukan password Gmail biasa
- Password harus **16 karakter tanpa spasi**
- Jangan commit `.env` ke Git!

#### 4. Clear Cache & Test

```bash
php artisan config:clear
php artisan cache:clear
```

Lalu test dengan membuat user baru atau reset password. Email akan terkirim sungguhan ke alamat tujuan.

---

## Cara Switching Antar Konfigurasi

### Dari Mailtrap ke Gmail

```env
# Ubah dari:
MAIL_DRIVER=mailtrap

# Menjadi:
MAIL_DRIVER=smtp
```

Lalu tambahkan konfigurasi Gmail (MAIL_MAILER, MAIL_HOST, dll).

### Dari Gmail ke Mailtrap

```env
# Ubah dari:
MAIL_DRIVER=smtp

# Menjadi:
MAIL_DRIVER=mailtrap
```

Pastikan `MAILTRAP_API_TOKEN` sudah terisi.

**Setelah perubahan, wajib clear cache:**

```bash
php artisan config:clear
php artisan cache:clear
```

---

## Testing Email

### Test 1: Via Frontend (Recommended)

#### Test Email User Baru
1. Login sebagai admin
2. Buka **User Management**
3. Klik "Tambah User Baru"
4. Isi form lengkap
5. Submit
6. Cek email:
   - **Mailtrap**: di https://mailtrap.io/inboxes
   - **Gmail**: di inbox email yang didaftarkan

#### Test Email Reset Password
1. Logout (atau buka incognito)
2. Klik "Lupa Password?"
3. Masukkan email yang terdaftar
4. Klik "Kirim Link Reset"
5. Cek email (sama seperti di atas)

#### Test Email Notifikasi
1. Login sebagai pegawai
2. Buat ticket baru
3. Admin assign ticket ke teknisi
4. Teknisi dan pegawai akan menerima email notifikasi
5. Cek email

### Test 2: Via Artisan Tinker

```bash
php artisan tinker
```

**Test Email User Baru:**

```php
$user = App\Models\User::first();
Mail::to('test@example.com')->send(new App\Mail\NewUserMail($user, 'password123'));
```

**Test Email Reset Password:**

```php
$user = App\Models\User::first();
Mail::to($user->email)->send(new App\Mail\ResetPasswordMail($user, 'test-token-123'));
```

**Test Email Notifikasi:**

```php
$user = App\Models\User::first();
$notification = App\Models\Notification::first();
Mail::to($user->email)->send(new App\Mail\NotificationMail($user, $notification));
```

---

## Troubleshooting

### Error: "MAILTRAP_API_TOKEN not configured"

**Penyebab**: `MAIL_DRIVER=mailtrap` tapi token tidak ada

**Solusi**:
```env
MAILTRAP_API_TOKEN=your_token_here
```

### Error: "Failed to authenticate on SMTP server"

**Penyebab**: Gmail App Password salah atau 2FA tidak aktif

**Solusi**:
1. Pastikan 2FA sudah aktif
2. Generate ulang App Password
3. Copy password tanpa spasi
4. Clear cache: `php artisan config:clear`

### Error: "Connection timeout"

**Penyebab**: Port SMTP diblokir atau konfigurasi salah

**Solusi**:
```env
MAIL_PORT=587          # Bukan 465
MAIL_ENCRYPTION=tls    # Bukan ssl
MAIL_HOST=smtp.gmail.com
```

### Email Masuk ke Spam

**Solusi untuk user**:
1. Mark as "Not Spam"
2. Tambahkan sender ke contacts

**Solusi untuk admin** (production):
1. Setup SPF record di DNS
2. Setup DKIM authentication
3. Setup DMARC policy
4. Gunakan verified domain

### Email Tidak Terkirim (Tidak Ada Error)

**Cek log Laravel:**

```bash
tail -f storage/logs/laravel.log
```

**Cek queue** (jika pakai queue):

```bash
php artisan queue:work
```

---

## Environment Variables Summary

### Required (Semua Mode)

```env
MAIL_DRIVER=smtp|mailtrap        # Pilih driver
MAIL_FROM_ADDRESS=email@domain.com
MAIL_FROM_NAME="SIGAP-TI BPS NTB"
FRONTEND_URL=http://localhost:5173
```

### Mailtrap Mode

```env
MAIL_DRIVER=mailtrap
MAILTRAP_API_TOKEN=your_api_token_here
```

### Gmail SMTP Mode

```env
MAIL_DRIVER=smtp
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=sigapti@gmail.com
MAIL_PASSWORD=16_digit_app_password
MAIL_ENCRYPTION=tls
```

---

## Best Practices

### Development
✅ Gunakan Mailtrap
✅ Test semua template email
✅ Jangan commit `.env` dengan kredensial

### Staging
✅ Gunakan Mailtrap atau dedicated test email
✅ Test dengan domain production

### Production
✅ Gunakan Gmail SMTP atau dedicated email service
✅ Monitor email delivery
✅ Setup email logging
✅ Backup App Password di tempat aman
✅ Rotate credentials secara berkala

---

## Files Terkait

- **Mailable Classes**:
  - `app/Mail/NewUserMail.php`
  - `app/Mail/ResetPasswordMail.php`
  - `app/Mail/NotificationMail.php`

- **Email Templates**:
  - `resources/views/emails/new-user.blade.php`
  - `resources/views/emails/reset-password.blade.php`
  - `resources/views/emails/notification.blade.php`

- **Controllers**:
  - `app/Http/Controllers/UserController.php` (user creation)
  - `app/Http/Controllers/PasswordResetController.php` (reset password)
  - `app/Services/TicketNotificationService.php` (notifications)

---

## FAQ

**Q: Bisa pakai SMTP lain selain Gmail?**  
A: Bisa, tinggal ganti `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` sesuai provider.

**Q: Berapa limit email per hari di Gmail?**  
A: 500 email/hari untuk akun gratis.

**Q: Apakah bisa pakai queue untuk email?**  
A: Bisa, ubah `QUEUE_CONNECTION=database` atau `redis`, lalu jalankan `php artisan queue:work`.

**Q: Email template bisa di-customize?**  
A: Bisa, edit file di `resources/views/emails/`.

**Q: Bisa kirim email dengan attachment?**  
A: Bisa, tambahkan di method `attachments()` pada Mailable class.

---

## Support

Untuk pertanyaan lebih lanjut, hubungi:
- Email: admin@sigapti.bps.go.id
- Dokumentasi Laravel Mail: https://laravel.com/docs/mail
- Mailtrap Docs: https://mailtrap.io/docs/
