# 📚 Panduan Lengkap: Mengekstrak & Dokumentasi API Calls

## 🎯 Ringkasan

Sistem ini menyediakan 3 cara untuk mendapatkan informasi API calls dari frontend:

1. **Script Otomatis** - `extract-api-calls.js` (RECOMMENDED ✅)
2. **Grep Manual** - Command line search
3. **Dokumentasi Statis** - File markdown yang sudah dibuat

---

## 🚀 Cara 1: Script Otomatis (RECOMMENDED)

### Langkah-langkah:

```bash
# 1. Pindah ke root directory project
cd /home/ubuntu/RPL/SistemLayananInternalTerpadu

# 2. Jalankan script ekstraksi
node extract-api-calls.js

# 3. Lihat hasil di terminal (ringkasan)
# 4. Lihat detail lengkap di file JSON yang dihasilkan
cat frontend-api-calls.json
```

### Output yang Dihasilkan:

#### A. Terminal Output
```
🔍 Mengekstrak API calls dari frontend...

✅ Ditemukan 120 API calls

================================================================================

📋 RINGKASAN API CALLS

GET /bmn-assets?${params}
  📍 Digunakan di 2 lokasi:
     - frontend/src/components/bmn-asset-management.tsx:100

POST tickets
  📍 Digunakan di 2 lokasi:
     - frontend/src/components/views/dashboards/user-dashboard.tsx:227

...

📊 STATISTIK

Jumlah calls per method:
  PATCH  : 38
  GET    : 32
  POST   : 28
  PUT    : 18
  DELETE : 4

Total unique endpoints: 49
Total API calls: 120
Total files: 22
```

#### B. File JSON Output (`frontend-api-calls.json`)

```json
{
  "summary": {
    "totalCalls": 120,
    "uniqueEndpoints": 49,
    "totalFiles": 22,
    "methodStats": {
      "GET": 32,
      "POST": 28,
      "PUT": 18,
      "PATCH": 38,
      "DELETE": 4
    },
    "generatedAt": "2025-12-15T12:00:00.000Z"
  },
  "groupedByEndpoint": {
    "GET /bmn-assets?${params}": [
      {
        "method": "GET",
        "endpoint": "/bmn-assets?${params}",
        "file": "frontend/src/components/bmn-asset-management.tsx",
        "line": 100,
        "context": "const response: any = await api.get(/bmn-assets?${params.toString()});"
      }
    ]
  },
  "allCalls": [...],
  "fileMap": {...}
}
```

### Keuntungan:
✅ Otomatis scan seluruh codebase  
✅ Output terstruktur (JSON + Terminal)  
✅ Include line numbers untuk debugging  
✅ Include context code  
✅ Statistik lengkap  

---

## 🔍 Cara 2: Grep Manual

### A. Cari Semua API Calls

```bash
# Cari semua api.get()
grep -r "api\.get(" frontend/src --include="*.tsx" --include="*.ts" -n

# Cari semua api.post()
grep -r "api\.post(" frontend/src --include="*.tsx" --include="*.ts" -n

# Cari semua api.put()
grep -r "api\.put(" frontend/src --include="*.tsx" --include="*.ts" -n

# Cari semua api.patch()
grep -r "api\.patch(" frontend/src --include="*.tsx" --include="*.ts" -n

# Cari semua api.delete()
grep -r "api\.delete(" frontend/src --include="*.tsx" --include="*.ts" -n
```

### B. Cari Endpoint Spesifik

```bash
# Cari endpoint yang berisi "tickets"
grep -r "api\." frontend/src --include="*.tsx" --include="*.ts" | grep "tickets"

# Cari endpoint yang berisi "zoom"
grep -r "api\." frontend/src --include="*.tsx" --include="*.ts" | grep "zoom"

# Cari endpoint yang berisi "work-orders"
grep -r "api\." frontend/src --include="*.tsx" --include="*.ts" | grep "work-orders"
```

### C. Cari di File Tertentu

```bash
# Cari API calls di file storage.ts
grep "api\." frontend/src/lib/storage.ts

# Cari API calls di folder tickets
grep -r "api\." frontend/src/components/views/tickets --include="*.tsx"

# Cari API calls di folder zoom
grep -r "api\." frontend/src/components/views/zoom --include="*.tsx"
```

### D. Advanced Grep

```bash
# Dengan context (5 lines sebelum & sesudah)
grep -r "api\.get(" frontend/src --include="*.tsx" -n -C 5

# Count berapa kali api.get digunakan
grep -r "api\.get(" frontend/src --include="*.tsx" | wc -l

# List file yang menggunakan API
grep -rl "api\." frontend/src --include="*.tsx" --include="*.ts"

# Dengan color highlighting
grep -r "api\." frontend/src --include="*.tsx" --color=always | less -R
```

---

## 📖 Cara 3: Dokumentasi Statis

### File yang Tersedia:

1. **docs/FRONTEND_API_CALLS.md**
   - Daftar semua endpoint yang digunakan
   - Grouped by kategori (Auth, Tickets, Zoom, dll)
   - Include lokasi file & line numbers
   - Update manual setiap ada perubahan

2. **docs/API_DOCUMENTATION_ID.md**
   - Dokumentasi lengkap API backend
   - Format: OpenAPI/Swagger style
   - Bahasa Indonesia
   - Include request/response examples

### Cara Membaca:

```bash
# Buka dengan text editor
nano docs/FRONTEND_API_CALLS.md

# Atau dengan less (untuk scroll)
less docs/FRONTEND_API_CALLS.md

# Atau dengan cat
cat docs/FRONTEND_API_CALLS.md

# Cari endpoint tertentu
grep -i "zoom" docs/FRONTEND_API_CALLS.md
```

---

## 🎨 Perbandingan 3 Cara

| Fitur | Script Auto | Grep Manual | Dokumentasi |
|-------|------------|-------------|-------------|
| **Kecepatan** | ⚡ Cepat | ⚡⚡ Sangat Cepat | ⚡⚡⚡ Instant |
| **Akurasi** | ✅ 100% | ✅ 100% | ⚠️ Perlu update manual |
| **Detail** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Easy to Use** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **JSON Output** | ✅ Yes | ❌ No | ❌ No |
| **Context Code** | ✅ Yes | ⚠️ Tergantung | ❌ No |
| **Statistik** | ✅ Yes | ⚠️ Manual count | ✅ Yes |

### Rekomendasi:

- **Development/Debugging:** Gunakan **Script Auto** atau **Grep Manual**
- **Quick Reference:** Buka **Dokumentasi Statis**
- **Analysis/Report:** Gunakan **Script Auto** (JSON output)

---

## 💡 Use Cases

### 1. Mencari endpoint yang tidak terdokumentasi di backend

```bash
# 1. Extract semua endpoints dari frontend
node extract-api-calls.js

# 2. Compare dengan api_docs.yaml
# (manual check atau buat script comparison)
```

### 2. Refactoring API client

```bash
# Cari semua penggunaan endpoint lama
grep -r "api.get('/old-endpoint" frontend/src

# Replace dengan endpoint baru
sed -i "s|'/old-endpoint|'/new-endpoint|g" frontend/src/**/*.tsx
```

### 3. Audit security

```bash
# Cari API calls tanpa authentication check
grep -r "api\." frontend/src --include="*.tsx" -B 5 | grep -v "auth"
```

### 4. Performance monitoring

```bash
# List semua API yang dipanggil saat page load
grep -r "useEffect\|componentDidMount" frontend/src -A 10 | grep "api\."
```

### 5. Generate test cases

```bash
# Extract endpoints untuk membuat mock API tests
node extract-api-calls.js
# Parse JSON output untuk generate test files
```

---

## 🛠️ Customisasi Script

### Edit `extract-api-calls.js` untuk:

#### 1. Filter by File Pattern

```javascript
// Di function walkDir, ubah regex:
if (/\.(ts|tsx)$/.test(file) && !file.includes('.d.ts') && !file.includes('test')) {
  callback(filePath);
}
```

#### 2. Export Format Berbeda

```javascript
// Tambahkan di akhir script:
fs.writeFileSync('api-calls.csv', 
  apiCalls.map(c => `${c.method},${c.endpoint},${c.file},${c.line}`).join('\n')
);
```

#### 3. Filter by Method

```javascript
// Filter hanya GET requests:
const getCalls = apiCalls.filter(c => c.method === 'GET');
```

#### 4. Generate Markdown

```javascript
// Generate markdown table:
let markdown = '| Method | Endpoint | File | Line |\n';
markdown += '|--------|----------|------|------|\n';
apiCalls.forEach(c => {
  markdown += `| ${c.method} | ${c.endpoint} | ${c.file} | ${c.line} |\n`;
});
fs.writeFileSync('api-calls.md', markdown);
```

---

## 🐛 Troubleshooting

### Problem: Script tidak jalan

```bash
# Check Node.js installed
node --version

# Should output: v18.x atau lebih tinggi

# Jika belum install:
sudo apt update
sudo apt install nodejs npm
```

### Problem: Tidak menemukan semua API calls

**Possible causes:**
1. API call menggunakan dynamic string (runtime)
2. API call di dalam library/package
3. API call menggunakan method selain `api.get/post/put/patch/delete`

**Solution:**
```bash
# Cari pattern lain:
grep -r "fetch\|axios\|request" frontend/src --include="*.tsx"
```

### Problem: Duplikasi dalam output

**Cause:** File yang sama di-scan multiple kali atau regex pattern overlap

**Solution:**
```javascript
// Deduplicate di script:
const uniqueCalls = [...new Set(apiCalls.map(JSON.stringify))].map(JSON.parse);
```

---

## 📊 Workflow Development

### 1. Sebelum Membuat Fitur Baru

```bash
# Check endpoints yang sudah ada
node extract-api-calls.js | grep -i "feature-name"

# Check di dokumentasi backend
grep -i "feature-name" docs/api_docs.yaml
```

### 2. Setelah Membuat Fitur

```bash
# Re-scan API calls
node extract-api-calls.js

# Update dokumentasi
# Edit docs/FRONTEND_API_CALLS.md
```

### 3. Code Review

```bash
# Check API calls di PR
git diff main..feature-branch | grep "api\."

# Verify semua endpoint ada di backend
```

---

## 📚 File Structure

```
SistemLayananInternalTerpadu/
├── extract-api-calls.js           # Script ekstraksi API calls
├── frontend-api-calls.json        # Output JSON (generated)
├── docs/
│   ├── API_DOCUMENTATION_ID.md    # Dokumentasi API Backend (ID)
│   ├── FRONTEND_API_CALLS.md      # Daftar API calls frontend
│   ├── API_EXTRACTION_GUIDE.md    # Panduan ini
│   └── api_docs.yaml              # OpenAPI spec (backend)
└── frontend/
    └── src/
        ├── lib/
        │   ├── api.ts             # API client utility
        │   └── storage.ts         # State management + API sync
        ├── components/            # UI components dengan API calls
        ├── hooks/                 # Custom hooks dengan API calls
        └── ...
```

---

## 🎓 Tips & Best Practices

### 1. Naming Convention

```typescript
// ✅ Good: Descriptive endpoint names
api.get('/tickets/stats/dashboard')
api.post('/tickets/${id}/diagnosis')

// ❌ Bad: Unclear endpoint names
api.get('/data')
api.post('/update')
```

### 2. Error Handling

```typescript
// ✅ Good: Proper error handling
try {
  const data = await api.get('/endpoint');
  // handle success
} catch (error) {
  // handle error
  console.error('API Error:', error);
}

// ❌ Bad: No error handling
const data = await api.get('/endpoint');
```

### 3. Type Safety

```typescript
// ✅ Good: TypeScript types
interface UserResponse {
  id: number;
  name: string;
}
const user = await api.get<UserResponse>('/users/1');

// ❌ Bad: No types
const user = await api.get('/users/1');
```

### 4. Reusable API Functions

```typescript
// ✅ Good: Centralized API functions
export const ticketApi = {
  getAll: (params) => api.get(`/tickets?${params}`),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
};

// ❌ Bad: Scattered API calls
// di component A: api.get('/tickets')
// di component B: api.get('/tickets')
// di component C: api.get('/tickets')
```

---

## 🔗 Links & Resources

- **API Backend Docs:** [docs/API_DOCUMENTATION_ID.md](../API_DOCUMENTATION_ID.md)
- **OpenAPI Spec:** [docs/api_docs.yaml](../api_docs.yaml)
- **Frontend API List:** [docs/FRONTEND_API_CALLS.md](../FRONTEND_API_CALLS.md)
- **API Client Code:** [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

---

**Last Updated:** 15 Desember 2025  
**Version:** 1.0.0
