# SIGAP-TI

[![Laravel](https://img.shields.io/badge/Laravel-12.x-red?logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.x-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://typescriptlang.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)](https://mysql.com)
[![Vite](https://img.shields.io/badge/Vite-7.x-purple?logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-cyan?logo=tailwindcss)](https://tailwindcss.com)

Sistem Layanan Internal Terpadu - Helpdesk & Asset Management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 12, PHP 8.3, Sanctum Auth |
| Frontend | React 19, TypeScript 5.9, Vite 7 |
| UI | Tailwind CSS 4, Radix UI, Lucide Icons |
| Database | MySQL 8.0 |
| API Docs | OpenAPI 3.0 (Scribe) |

## Installation

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Edit `frontend/.env.local`:
```env
VITE_API=http://localhost:8000/api
```

## Email Configuration

### Gmail SMTP

Edit `backend/.env`:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-digit-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="SIGAP-TI"
FRONTEND_URL=http://localhost:5173
```

Untuk mendapatkan App Password:
1. Aktifkan 2FA di Google Account
2. Buka Security > App Passwords
3. Generate password untuk "Mail"

### Mailtrap (Testing)

```env
MAIL_DRIVER=mailtrap
MAILTRAP_API_TOKEN=your-api-token
MAIL_FROM_ADDRESS=hello@example.com
```

Clear cache setelah perubahan:
```bash
php artisan config:clear
```

## API Documentation

Dokumentasi API tersedia di: [`docs/api_docs.yaml`](docs/api_docs.yaml)

Format: OpenAPI 3.0

Regenerate docs:
```bash
php artisan scribe:generate
```

## Catatan

Dokumentasi lebih lengkapnya bisa diakses di [docs/dokumentasi.pdf](docs/dokumentasi.pdf)