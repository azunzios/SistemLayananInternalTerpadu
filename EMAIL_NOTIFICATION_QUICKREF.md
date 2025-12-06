# Email Notification - Quick Reference

## 📋 Setup Checklist

- [ ] Setup Gmail App Password (lihat `GMAIL_SMTP_SETUP.md`)
- [ ] Update `backend/.env` dengan konfigurasi email
- [ ] Run: `php artisan config:clear`
- [ ] Test email: `php artisan test:email-notification your-email@example.com`
- [ ] Verifikasi email masuk (cek spam juga)

## ⚡ Quick Commands

```bash
# Test kirim email
php artisan test:email-notification your-email@example.com

# Test dengan user spesifik
php artisan test:email-notification your-email@example.com --user-id=1

# Clear config cache
php artisan config:clear

# Monitor logs
tail -f backend/storage/logs/laravel.log

# Check queue (if using queue)
php artisan queue:work
```

## 🔧 .env Configuration

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=sigapti@gmail.com
MAIL_PASSWORD=xxxxxxxxxxxx  # 16-digit App Password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=sigapti@gmail.com
MAIL_FROM_NAME="SIGAPTI BPS NTB"

FRONTEND_URL=http://localhost:5173
```

## 📧 Notification Types

| # | Event | Penerima | Tipe |
|---|-------|----------|------|
| 1 | Tiket baru | admin_layanan | info |
| 2 | Tiket di-assign | teknisi & pelapor | info |
| 3 | Status berubah | pelapor | info/success/error |
| 4 | Zoom approved | pelapor | success |
| 5 | Zoom rejected | pelapor | error |
| 6 | Tiket selesai | pelapor | success |
| 7 | Work Order dibuat | admin_penyedia | info |
| 8 | Work Order update | teknisi & pelapor | info/success |
| 9 | WO semua selesai | teknisi | success |
| 10 | Diagnosis selesai | pelapor & admin | info/warning |
| 11 | Komentar baru | pihak terkait | info |

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Email tidak terkirim | `php artisan config:clear` |
| Connection refused | Cek MAIL_HOST & MAIL_PORT |
| Auth failed | Regenerate App Password Gmail |
| 2FA not enabled | Aktifkan 2FA di Google Account |
| Email di spam | Normal, minta user whitelist |

## 📁 Important Files

```
backend/
├── app/
│   ├── Mail/
│   │   └── NotificationMail.php          # Mailable class
│   ├── Services/
│   │   └── TicketNotificationService.php # Notification logic
│   └── Console/Commands/
│       └── TestEmailNotification.php     # Test command
├── resources/views/emails/
│   └── notification.blade.php            # Email template
└── config/
    └── mail.php                          # Mail config

Docs:
├── EMAIL_NOTIFICATION_SYSTEM.md          # Full documentation
├── GMAIL_SMTP_SETUP.md                   # Gmail setup guide
└── EMAIL_NOTIFICATION_QUICKREF.md        # This file
```

## 🚀 Production Tips

1. **Use Queue:**
   ```env
   QUEUE_CONNECTION=database
   ```
   ```bash
   php artisan queue:table
   php artisan migrate
   php artisan queue:work
   ```

2. **Use Dedicated Email Service:**
   - SendGrid (recommended)
   - Mailgun
   - Amazon SES

3. **Monitor Failed Jobs:**
   ```bash
   php artisan queue:failed
   php artisan queue:retry all
   ```

## 💡 Development vs Production

| Environment | MAIL_MAILER | Notes |
|-------------|-------------|-------|
| Local Dev | `log` | Emails logged, not sent |
| Staging | `smtp` | Test with real email |
| Production | `smtp`+queue | Use queue for performance |

---

**Need Help?** 
- Full docs: `EMAIL_NOTIFICATION_SYSTEM.md`
- Gmail setup: `GMAIL_SMTP_SETUP.md`
- Check logs: `backend/storage/logs/laravel.log`
