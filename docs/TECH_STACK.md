# 🛠️ Tech Stack

**Sistem Layanan Internal Terpadu - BPS NTB**  
*Last Updated: 15 Desember 2025*

---

## 🎯 Core Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Backend Framework** | Laravel | 12.38.1 |
| **Frontend Framework** | React | 19.2.1 |
| **Database** | MySQL/MariaDB | 8.0.44 |
| **Runtime** | PHP | 8.3.6 |
| **Node.js** | Node | 24.11.1 |
| **Build Tool** | Vite | 7.2.2 |
| **Language** | TypeScript | 5.9.3 |

---

## 🔧 Backend Dependencies

### Production
```json
{
  "laravel/sanctum": "^4.0",           // API Authentication
  "phpoffice/phpspreadsheet": "^5.3",  // Excel Import/Export
  "railsware/mailtrap-php": "^3.9",    // Email Notifications (11 types)
  "laravel/tinker": "^2.10.1"          // REPL/Debugging
}
```

### Development
```json
{
  "knuckleswtf/scribe": "^5.6",    // API Documentation (OpenAPI)
  "pestphp/pest": "^4.1",          // Testing Framework
  "laravel/pint": "^1.24",         // Code Linting
  "laravel/pail": "^1.2.2",        // Real-time Logs
  "fakerphp/faker": "^1.23"        // Fake Data Generation
}
```

---

## 💻 Frontend Dependencies

### Core Libraries
```json
{
  "react": "^19.2.1",
  "react-router-dom": "^7.9.6",        // Routing
  "tailwindcss": "^4.1.17",            // Styling
  "@radix-ui/react-*": "^1.x-2.x"     // UI Components (26 packages)
}
```

### Key Utilities
```json
{
  "react-hook-form": "^7.66.0",    // Form Management
  "recharts": "^3.4.1",            // Charts & Visualization
  "date-fns": "^4.1.0",            // Date Utilities
  "lucide-react": "^0.553.0",      // Icons (1000+)
  "motion": "^12.23.24",           // Animations
  "sonner": "^2.0.7",              // Toast Notifications
  "cmdk": "^1.1.1",                // Command Menu (Cmd+K)
  "next-themes": "^0.4.6"          // Dark/Light Mode
}
```

---

## 🗄️ Database

**MySQL 8.0.44** - 19 Tables:

```
Users & Auth (3):        users, roles, role_user
Assets (2):              assets, asset_conditions
Tickets (5):             tickets, comments, feedbacks, diagnoses, status_histories
Work Orders (3):         work_orders, items, status_histories
Zoom (2):                zoom_accounts, bookings
Kartu Kendali (1):       kartu_kendali
System (3):              notifications, audit_logs, sessions
```

---

## 🛠️ Development Commands

### Backend
```bash
php artisan serve           # Start dev server (port 8000)
php artisan migrate         # Run migrations
php artisan test            # Run tests
php artisan scribe:generate # Generate API docs
composer install            # Install dependencies
```

### Frontend
```bash
npm run dev        # Start dev server (port 5173)
npm run build      # Production build
npm run lint       # Code linting
npm install        # Install dependencies
```

---

## 📦 System Requirements

**Development:**
- PHP 8.2+
- Node.js 18+
- MySQL 8.0+ / MariaDB 10.5+
- 4GB RAM, 10GB Storage

**Production:**
- PHP 8.2+
- MySQL 8.0+
- 2GB RAM (minimum), 20GB Storage
- SSL Certificate, Domain

---

## 🚀 Architecture

```
Frontend (React + Vite)
    ↓ HTTP/JSON API
Backend (Laravel + Sanctum)
    ↓ Eloquent ORM
Database (MySQL 8)
```

**Ports:**
- Frontend: 5173 (dev), 80/443 (prod)
- Backend: 8000 (dev), 80/443 (prod)
- Database: 3306

---

## 🔒 Security

```
Backend:  Sanctum Auth, CSRF Protection, XSS Prevention, 
          SQL Injection Prevention, Password Hashing, Rate Limiting

Frontend: Input Validation, XSS Prevention, Secure Cookies, HTTPS
```

---

## 📊 Features

**Backend:**
- 100+ RESTful API endpoints
- Multi-role system (4 roles)
- Email notifications (11 types)
- Excel import/export
- Queue management
- Audit logging

**Frontend:**
- SPA with dynamic routing
- Dark/Light theme
- Real-time notifications
- Interactive dashboard
- Data visualization
- Form validation
- Responsive design

---

## 🌐 Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+, Mobile (iOS/Android)

---

## 📚 Related Docs

- [API Documentation (ID)](./API_DOCUMENTATION_ID.md)
- [Frontend API Calls](./FRONTEND_API_CALLS.md)
- [OpenAPI Spec](./api_docs.yaml)
