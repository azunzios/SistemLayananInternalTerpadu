# Setup Gmail SMTP untuk Reset Password

## Langkah 1: Aktifkan 2-Factor Authentication (2FA)

1. Buka [Google Account Security](https://myaccount.google.com/security)
2. Login dengan akun **sigapti@gmail.com**
3. Di bagian "Signing in to Google", aktifkan **2-Step Verification**
4. Ikuti instruksi untuk setup (biasanya dengan nomor HP)

## Langkah 2: Generate App Password

1. Setelah 2FA aktif, kembali ke [Google Account Security](https://myaccount.google.com/security)
2. Di bagian "Signing in to Google", klik **App passwords**
3. Klik **Select app** → pilih **Mail**
4. Klik **Select device** → pilih **Other (Custom name)**
5. Ketik nama: **SIGAPTI Laravel**
6. Klik **Generate**
7. Google akan menampilkan **16-digit password**, contoh: `abcd efgh ijkl mnop`
8. **COPY password ini** (tanpa spasi)

## Langkah 3: Update File .env

Buka file `backend/.env` dan update bagian mail configuration:

```env
# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=sigapti@gmail.com
MAIL_PASSWORD=abcdefghijklmnop    # <-- Paste 16-digit password dari step 2 (TANPA SPASI)
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=sigapti@gmail.com
MAIL_FROM_NAME="SIGAPTI BPS NTB"

# Frontend URL untuk reset password links
FRONTEND_URL=http://localhost:5173
```

## Langkah 4: Testing

### Test 1: Kirim Test Email dari Tinker

```bash
php artisan tinker
```

Kemudian jalankan:

```php
Mail::raw('Test email dari SIGAPTI', function ($message) {
    $message->to('email_anda@example.com')
            ->subject('Test Email SIGAPTI');
});
```

Jika berhasil, akan return `null` tanpa error.

### Test 2: Test Forgot Password Flow

1. Buka frontend: http://localhost:5173
2. Klik "Lupa Password?"
3. Masukkan email yang terdaftar di database
4. Klik "Kirim Link Reset"
5. Cek inbox email (termasuk folder spam)

### Test 3: Verify Email Diterima

Email yang diterima akan berisi:

- Subject: "Reset Password - SIGAPTI BPS NTB"
- Button "Reset Password" yang mengarah ke: `http://localhost:5173/reset-password?token=xxx&email=xxx`
- Link akan expired dalam 1 jam

## Troubleshooting

### Error: "Failed to authenticate"

Pastikan:

- 2FA sudah aktif
- App password yang di-copy **TANPA SPASI**
- Gunakan app password, BUKAN password Gmail biasa

### Error: "Connection timeout"

Pastikan:

- Port 587 tidak diblokir firewall
- MAIL_ENCRYPTION=tls (bukan ssl)
- MAIL_HOST=smtp.gmail.com (bukan smtp.google.com)

### Email masuk ke Spam

Normal untuk pertama kali. Beberapa cara mengatasi:

1. Mark as "Not Spam" di inbox
2. Tambahkan sigapti@gmail.com ke contacts
3. Untuk production: Setup SPF, DKIM, DMARC records

## Production Setup (Untuk Deploy)

Jika deploy ke server production:

1. Update `FRONTEND_URL` di `.env`:

   ```env
   FRONTEND_URL=https://sigapti.bps-ntb.go.id
   ```

2. Pertimbangkan upgrade ke:
   - Google Workspace (unlimited emails)
   - AWS SES (cheaper untuk volume tinggi)
   - SendGrid, Mailgun, dll

## Fitur Remember Me

Fitur "Ingat Saya" sudah aktif dan akan:

- Menyimpan session selama 30 hari jika checkbox dicentang
- Auto-login saat user kembali ke aplikasi
- Clear session saat user logout manual

## Security Notes

⚠️ **PENTING**:

- **JANGAN commit file .env ke git**
- App password sama pentingnya dengan password Gmail
- Rotate app password secara berkala (setiap 3-6 bulan)
- Monitor Gmail activity untuk akses yang mencurigakan

## Testing Checklist

- [ ] 2FA aktif di akun Gmail
- [ ] App password sudah digenerate
- [ ] .env sudah diupdate dengan app password yang benar
- [ ] Test email berhasil terkirim via tinker
- [ ] Forgot password flow berhasil (email diterima)
- [ ] Link reset password valid dan bisa dibuka
- [ ] Reset password berhasil dan bisa login dengan password baru
- [ ] Token expired setelah 1 jam
- [ ] Remember me checkbox berfungsi
