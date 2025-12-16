# 🎯 RINGKASAN: Cara Mendapatkan Semua API Calls dari Frontend

## ✅ Yang Sudah Dibuat

1. **Script Ekstraksi Otomatis** 
   - File: `extract-api-calls.js`
   - ✨ Scan otomatis semua file `.ts` dan `.tsx`
   - 📊 Output JSON + Terminal ringkasan

2. **Dokumentasi API Backend (Bahasa Indonesia)**
   - File: `docs/API_DOCUMENTATION_ID.md`
   - 📖 100+ endpoint dengan detail lengkap
   - 🇮🇩 Full bahasa Indonesia

3. **Daftar API Calls Frontend**
   - File: `docs/FRONTEND_API_CALLS.md`
   - 📋 49 unique endpoints, 120 total calls
   - 🗂️ Grouped by kategori

4. **Panduan Ekstraksi API**
   - File: `docs/API_EXTRACTION_GUIDE.md`
   - 📚 Tutorial lengkap 3 metode
   - 💡 Tips & best practices

5. **Update README.md**
   - Tambahkan section dokumentasi API
   - Link ke semua file dokumentasi

---

## 🚀 CARA CEPAT (3 Metode)

### Metode 1: Script Otomatis ⭐ RECOMMENDED

```bash
cd /home/ubuntu/RPL/SistemLayananInternalTerpadu
node extract-api-calls.js
```

**Output:**
```
✅ Ditemukan 120 API calls

📋 RINGKASAN API CALLS

GET /bmn-assets?${params}
  📍 Digunakan di 2 lokasi:
     - frontend/src/components/bmn-asset-management.tsx:100

POST tickets
  📍 Digunakan di 2 lokasi:
     - frontend/src/components/views/dashboards/user-dashboard.tsx:227

📊 STATISTIK
  GET    : 32
  POST   : 28
  PATCH  : 38
  PUT    : 18
  DELETE : 4

Total unique endpoints: 49
Total API calls: 120
Total files: 22

💾 Detail lengkap disimpan ke: frontend-api-calls.json
```

### Metode 2: Grep Manual (Quick Search)

```bash
# Cari semua GET requests
grep -r "api.get(" frontend/src --include="*.tsx" --include="*.ts" -n

# Cari semua POST requests
grep -r "api.post(" frontend/src --include="*.tsx" --include="*.ts" -n

# Cari endpoint tertentu
grep -r "tickets" frontend/src --include="*.tsx" | grep "api\."

# Dengan context (5 lines sebelum & sesudah)
grep -r "api.get(" frontend/src --include="*.tsx" -n -C 5
```

### Metode 3: Baca Dokumentasi (Instant)

```bash
# Buka dokumentasi yang sudah dibuat
cat docs/FRONTEND_API_CALLS.md

# Atau dengan less (bisa scroll)
less docs/FRONTEND_API_CALLS.md

# Cari endpoint spesifik
grep -i "zoom" docs/FRONTEND_API_CALLS.md
```

---

## 📊 Hasil Ekstraksi

### Statistik
- **Total API Calls:** 120
- **Unique Endpoints:** 49
- **Total Files:** 22

### Breakdown by Method
| Method | Count | Percentage |
|--------|-------|------------|
| PATCH  | 38    | 31.7%      |
| GET    | 32    | 26.7%      |
| POST   | 28    | 23.3%      |
| PUT    | 18    | 15.0%      |
| DELETE | 4     | 3.3%       |

### Top 10 Most Used Endpoints

1. **GET zoom/accounts** - 8 calls
2. **PATCH tickets/${ticket.id}/status** - 12 calls
3. **POST work-orders** - 4 calls
4. **PATCH tickets/${ticketId}/status** - 4 calls
5. **GET /bmn-assets?${params}** - 2 calls
6. **PUT zoom/accounts/${id}** - 2 calls
7. **GET tickets-counts${query}** - 2 calls
8. **POST tickets** - 2 calls
9. **GET /tickets/${ticketId}/diagnosis** - 2 calls
10. **GET kartu-kendali?${params}** - 2 calls

### Kategori Endpoint

#### 🔐 Autentikasi & Profil (3)
- POST /change-password
- POST change-role
- POST logout

#### 📦 Manajemen Aset BMN (6)
- GET /bmn-assets?${params}
- POST /bmn-assets
- PUT /bmn-assets/${id}
- DELETE /bmn-assets/${id}
- POST /bmn-assets/import
- GET assets/search/by-code-nup

#### 🎫 Manajemen Tiket (8)
- GET tickets-counts${query}
- POST tickets
- PATCH tickets/${id}
- PATCH tickets/${id}/status
- PATCH tickets/${id}/approve
- PATCH tickets/${id}/assign
- PUT tickets
- GET /tickets/${id}

#### 🔬 Diagnosis & Feedback (3)
- GET /tickets/${id}/diagnosis
- POST tickets/${id}/diagnosis
- POST tickets/${id}/feedback

#### 📹 Zoom Management (9)
- GET zoom/accounts
- POST zoom/accounts
- PUT zoom/accounts/${id}
- DELETE zoom/accounts/${id}
- PATCH tickets/${id}/approve-zoom
- PATCH tickets/${id}/reject-zoom
- GET tickets/calendar/grid
- GET tickets?type=zoom_meeting

#### 🛠️ Work Orders (6)
- GET /tickets/${id}/work-orders
- POST work-orders
- PUT work-orders
- PUT work-orders/${id}
- PATCH work-orders/${id}/status
- PATCH work-orders/${id}/change-bmn-condition

#### 📋 Kartu Kendali (4)
- GET kartu-kendali?${params}
- GET kartu-kendali/${id}
- POST kartu-kendali/from-work-order
- PUT kartu-kendali

#### 🔔 Notifikasi (4)
- PATCH /notifications/${id}/read
- PATCH /notifications/read-all
- POST notifications
- PUT notifications

#### 👥 User Management (2)
- GET users?search=${query}
- PUT users

#### 📊 Dashboard & Stats (2)
- GET /tickets/stats/super-admin-dashboard
- POST audit-logs

---

## 📁 File Struktur

```
SistemLayananInternalTerpadu/
├── extract-api-calls.js               # ⚙️ Script ekstraksi
├── frontend-api-calls.json            # 📄 Output JSON (generated)
│
├── docs/
│   ├── API_DOCUMENTATION_ID.md        # 📖 Dokumentasi API Backend (ID)
│   ├── FRONTEND_API_CALLS.md          # 📋 Daftar API calls frontend
│   ├── API_EXTRACTION_GUIDE.md        # 📚 Panduan lengkap
│   ├── API_CALLS_SUMMARY.md           # 📊 File ini (ringkasan)
│   └── api_docs.yaml                  # 🔧 OpenAPI spec
│
└── frontend/src/
    ├── lib/
    │   ├── api.ts                     # 🛠️ API client utility
    │   └── storage.ts                 # 💾 State + API sync (30+ calls)
    │
    ├── components/
    │   ├── bmn-asset-management.tsx   # 📦 Asset CRUD (6 calls)
    │   └── views/
    │       ├── tickets/               # 🎫 Ticket management
    │       ├── zoom/                  # 📹 Zoom management
    │       ├── work-orders/           # 🛠️ Work order management
    │       └── shared/                # 🔄 Shared components
    │
    └── hooks/
        ├── use-notifications.ts       # 🔔 Notification hooks (2 calls)
        └── use-super-admin-dashboard.ts # 📊 Dashboard hook
```

---

## 🎓 Cheatsheet Commands

```bash
# === EKSTRAKSI OTOMATIS ===
node extract-api-calls.js                    # Run script
cat frontend-api-calls.json                  # Lihat JSON output

# === GREP PATTERNS ===
grep -r "api\." frontend/src --include="*.tsx" -n        # Semua API calls
grep -r "api\.get(" frontend/src -n                      # GET only
grep -r "api\.post(" frontend/src -n                     # POST only
grep -r "tickets" frontend/src | grep "api\."            # Endpoint contains "tickets"

# === STATISTIK ===
grep -r "api\.get(" frontend/src | wc -l                 # Count GET calls
grep -rl "api\." frontend/src --include="*.tsx" | wc -l  # Count files using API

# === DOKUMENTASI ===
less docs/FRONTEND_API_CALLS.md              # Baca dokumentasi
grep -i "zoom" docs/FRONTEND_API_CALLS.md    # Cari endpoint zoom
cat docs/API_EXTRACTION_GUIDE.md             # Panduan lengkap

# === BACKEND API DOCS ===
less docs/API_DOCUMENTATION_ID.md            # Dokumentasi backend (ID)
grep -i "ticket" docs/API_DOCUMENTATION_ID.md # Cari endpoint tiket
```

---

## 💡 Tips Penggunaan

### Untuk Development
```bash
# Sebelum membuat fitur baru, check endpoint yang ada
node extract-api-calls.js | grep -i "feature-name"

# Check apakah endpoint sudah ada di backend
grep -i "feature-name" docs/api_docs.yaml
```

### Untuk Code Review
```bash
# Check API calls yang berubah di PR
git diff main..feature-branch | grep "api\."
```

### Untuk Testing
```bash
# Export endpoints untuk mock API
node extract-api-calls.js
# Parse frontend-api-calls.json untuk generate mocks
```

### Untuk Documentation
```bash
# Update dokumentasi setelah perubahan
node extract-api-calls.js
# Manual update docs/FRONTEND_API_CALLS.md jika perlu
```

---

## 🔗 Quick Links

| Dokumen | Path | Deskripsi |
|---------|------|-----------|
| **API Backend (ID)** | [docs/API_DOCUMENTATION_ID.md](API_DOCUMENTATION_ID.md) | Dokumentasi lengkap 100+ endpoint |
| **Frontend API List** | [docs/FRONTEND_API_CALLS.md](FRONTEND_API_CALLS.md) | Daftar 49 endpoint yang digunakan |
| **Extraction Guide** | [docs/API_EXTRACTION_GUIDE.md](API_EXTRACTION_GUIDE.md) | Tutorial 3 metode ekstraksi |
| **OpenAPI Spec** | [docs/api_docs.yaml](api_docs.yaml) | Spesifikasi OpenAPI 3.0 |
| **API Client** | [frontend/src/lib/api.ts](../frontend/src/lib/api.ts) | Utility API calls |
| **Storage Manager** | [frontend/src/lib/storage.ts](../frontend/src/lib/storage.ts) | State + API sync |

---

## ❓ FAQ

**Q: Bagaimana cara update dokumentasi setelah ada endpoint baru?**
```bash
# 1. Re-scan frontend
node extract-api-calls.js

# 2. Update dokumentasi backend (jika ada perubahan)
cd backend
php artisan scribe:generate

# 3. Manual update docs/FRONTEND_API_CALLS.md jika diperlukan
```

**Q: Kenapa ada duplikasi dalam hasil ekstraksi?**
A: Script menangkap setiap occurrence, jadi jika endpoint dipanggil 2x di file yang sama, akan muncul 2x. Ini membantu tracking usage frequency.

**Q: Bagaimana cara filter hasil grep?**
```bash
# Filter by method
grep -r "api\.get(" frontend/src

# Filter by endpoint
grep -r "tickets" frontend/src | grep "api\."

# Filter by file pattern
grep -r "api\." frontend/src/components/views/zoom
```

**Q: Script tidak menemukan semua API calls?**
A: Script menggunakan regex pattern untuk menangkap `api.get/post/put/patch/delete()`. Jika ada pattern lain (misal: dynamic strings), gunakan grep manual.

**Q: Bagaimana cara export ke format lain (CSV, Excel)?**
A: Edit `extract-api-calls.js`, tambahkan export function:
```javascript
// CSV
const csv = apiCalls.map(c => `${c.method},${c.endpoint},${c.file},${c.line}`).join('\n');
fs.writeFileSync('api-calls.csv', csv);
```

---

## 📝 Changelog

**v1.0.0 - 15 Desember 2025**
- ✅ Initial release
- ✅ Script ekstraksi otomatis
- ✅ Dokumentasi lengkap (4 files)
- ✅ Support 120 API calls, 49 endpoints
- ✅ 3 metode ekstraksi (Auto, Grep, Docs)

---

**Last Updated:** 15 Desember 2025  
**Maintainer:** Development Team  
**Version:** 1.0.0

