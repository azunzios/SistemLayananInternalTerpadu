# Analisis Multi-Role System - SIGAPTI BPS NTB

## 📋 Executive Summary

**Status**: ⚠️ **PARTIALLY IMPLEMENTED - NEEDS IMPROVEMENT**

Multi-role system sudah diimplementasikan di database dan beberapa bagian kode, namun masih ada **inkonsistensi** antara backend dan frontend yang dapat menyebabkan masalah authorization dan user experience.

---

## ✅ Yang Sudah Benar

### 1. **Database Structure** ✅

```sql
-- Table users
roles JSON -- Array of roles: ["admin_layanan", "teknisi"]
is_active BOOLEAN
```

- ✅ Field `roles` bertipe JSON array
- ✅ Cast ke array di Model: `'roles' => 'array'`
- ✅ Migration sudah benar

### 2. **Backend - User Model** ✅

```php
// app/Models/User.php
protected $fillable = ['roles', ...];
protected function casts(): array {
    return ['roles' => 'array', ...];
}
```

### 3. **Backend - HasRoleHelper Trait** ✅

```php
// app/Traits/HasRoleHelper.php
- getUserRoles($user)      // Parse roles jadi array
- userHasRole($user, $role) // Check single role
- userHasAnyRole($user, $rolesArray) // Check any
- userHasAllRoles($user, $rolesArray) // Check all
```

### 4. **Frontend - Type Definition** ✅

```typescript
// types/index.ts
export interface User {
  role: UserRole; // Primary/active role
  roles: UserRole[]; // All available roles
}
```

### 5. **Frontend - Helper Functions** ✅

```typescript
// lib/utils.ts
-getUserPrimaryRole(user) - // Get first role
  userHasRole(user, role) - // Check if has role
  getUserRoles(user); // Get all roles array
```

---

## ❌ Masalah yang Ditemukan

### 1. **CRITICAL: Tidak Ada Role-Based Middleware di Backend** ❌

**Masalah:**

```php
// routes/api.php - TIDAK ADA MIDDLEWARE ROLE!
Route::apiResource('users', UserController::class);
Route::prefix('bmn-assets')->group(function () {
    // Comment: "Super Admin only" tapi TIDAK ADA enforcement
});
```

**Dampak:**

- ❌ Siapa saja yang login bisa akses endpoint apapun
- ❌ Pegawai bisa akses user management
- ❌ Teknisi bisa akses BMN assets
- ❌ **MAJOR SECURITY RISK**

**Solusi Dibutuhkan:**

```php
// Buat middleware CheckRole
Route::middleware(['auth:sanctum', 'role:super_admin'])->group(function () {
    Route::apiResource('users', UserController::class);
    Route::prefix('bmn-assets')->group(...);
});

Route::middleware(['auth:sanctum', 'role:admin_layanan,super_admin'])->group(function () {
    Route::patch('/tickets/{ticket}/approve', ...);
});
```

### 2. **Inkonsistensi Backend - Manual Role Checking** ⚠️

**Masalah:**

```php
// TicketController.php - Line 98-104
$userRoles = is_array($user->roles) ? $user->roles : json_decode($user->roles ?? '[]', true);
if (!in_array('admin_layanan', $userRoles) &&
    !in_array('super_admin', $userRoles) &&
    !in_array('teknisi', $userRoles)) {
    // Filter ke user sendiri
}
```

**Mengapa Bermasalah:**

- ✅ HasRoleHelper trait **SUDAH ADA** tapi tidak dipakai
- ❌ Code duplikasi di banyak tempat
- ❌ Sulit maintenance
- ❌ Rawan typo dan bug

**Seharusnya:**

```php
use HasRoleHelper;

if (!$this->userHasAnyRole($user, ['admin_layanan', 'super_admin', 'teknisi'])) {
    // Filter ke user sendiri
}
```

### 3. **Frontend - Inkonsistensi Akses `user.role` vs `user.roles`** ⚠️

**Masalah:**
Banyak komponen masih akses `currentUser.role` secara langsung tanpa cek multi-role:

```typescript
// ❌ SALAH - Hanya cek 1 role
if (currentUser.role === 'admin_layanan') { ... }

// ❌ SALAH - Tidak support multi-role
const activeRole = getActiveRole(currentUser.id) || currentUser.role;
```

**Ditemukan di:**

- `sidebar.tsx` (line 53)
- `main-layout.tsx` (line 100, 106, 108, 152, 185, 226)
- `ticket-list.tsx` (line 83)
- `ticket-detail.tsx` (line 175)
- `ticket-detail-utils.ts` (line 287)
- `ticket-detail-alerts.tsx` (line 62, 101, 131, 267, 302, 332)
- `user-management.tsx` (line 20, 76, 97, 167, 394)
- `user-management-table.tsx` (line 123, 161, 189)
- `user-dashboard.tsx` (line 67)
- `dashboard.tsx` (line 19)
- `profile-settings.tsx` (line 166, 170)

**Dampak:**

- ⚠️ User dengan multiple roles hanya bisa akses fitur dari 1 role
- ⚠️ Switching role tidak reliable
- ⚠️ UI permission checks tidak akurat

**Seharusnya:**

```typescript
// ✅ BENAR - Support multi-role
import { userHasRole, getUserRoles } from '@/lib/utils';

if (userHasRole(currentUser, 'admin_layanan')) { ... }
// atau
if (getUserRoles(currentUser).includes('admin_layanan')) { ... }
```

### 4. **Tidak Ada Role Validation di API Response** ⚠️

**Masalah:**

```php
// UserResource.php - TIDAK ADA validasi roles
return [
    'roles' => $this->roles, // Bisa null, bisa string, bisa array
];
```

**Seharusnya:**

```php
'roles' => is_array($this->roles) ? $this->roles : json_decode($this->roles ?? '["pegawai"]', true),
```

### 5. **API Routes Tidak Terstruktur Berdasarkan Permission** ❌

**Masalah:**
Semua routes dalam 1 `auth:sanctum` group tanpa granular permission:

```php
Route::middleware('auth:sanctum')->group(function () {
    // Semua endpoint dicampur:
    Route::apiResource('users', UserController::class); // Harusnya super_admin only
    Route::apiResource('tickets', TicketController::class); // Harusnya all roles
    Route::prefix('bmn-assets')... // Harusnya super_admin only
});
```

**Seharusnya:**

```php
// Public endpoints for all authenticated users
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', ...);
    Route::apiResource('tickets', TicketController::class);
});

// Super Admin only
Route::middleware(['auth:sanctum', 'role:super_admin'])->group(function () {
    Route::apiResource('users', UserController::class);
    Route::prefix('bmn-assets')->group(...);
});

// Admin Layanan + Super Admin
Route::middleware(['auth:sanctum', 'role:admin_layanan,super_admin'])->group(function () {
    Route::patch('/tickets/{ticket}/approve', ...);
});
```

---

## 🔧 Rekomendasi Perbaikan (Prioritas)

### PRIORITY 1 - CRITICAL SECURITY 🔴

#### 1.1 Buat Middleware CheckRole

```php
// app/Http/Middleware/CheckRole.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Traits\HasRoleHelper;

class CheckRole
{
    use HasRoleHelper;

    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (!$this->userHasAnyRole($user, $roles)) {
            return response()->json([
                'message' => 'Forbidden - Insufficient permissions',
                'required_roles' => $roles,
                'user_roles' => $this->getUserRoles($user)
            ], 403);
        }

        return $next($request);
    }
}
```

#### 1.2 Register Middleware

```php
// bootstrap/app.php atau app/Http/Kernel.php
protected $middlewareAliases = [
    'role' => \App\Http\Middleware\CheckRole::class,
];
```

#### 1.3 Apply Middleware ke Routes

```php
// routes/api.php
Route::middleware(['auth:sanctum', 'role:super_admin'])->group(function () {
    Route::apiResource('users', UserController::class);
    Route::patch('/users/{user}/roles', [UserController::class, 'updateRoles']);
    Route::prefix('bmn-assets')->group(...);
});

Route::middleware(['auth:sanctum', 'role:admin_layanan,super_admin'])->group(function () {
    Route::patch('/tickets/{ticket}/approve', [TicketController::class, 'approve']);
    Route::get('/tickets/stats/admin-layanan-dashboard', ...);
});

Route::middleware(['auth:sanctum', 'role:teknisi,admin_layanan,super_admin'])->group(function () {
    Route::patch('/tickets/{ticket}/status', [TicketController::class, 'updateStatus']);
});
```

### PRIORITY 2 - CODE QUALITY 🟡

#### 2.1 Konsisten Pakai HasRoleHelper di Controllers

```php
// ❌ SEBELUM
$userRoles = is_array($user->roles) ? $user->roles : json_decode($user->roles ?? '[]', true);
if (!in_array('admin_layanan', $userRoles)) { ... }

// ✅ SESUDAH
use HasRoleHelper;

if (!$this->userHasRole($user, 'admin_layanan')) { ... }
```

#### 2.2 Tambahkan Role Validation di UserResource

```php
// app/Http/Resources/UserResource.php
public function toArray($request)
{
    return [
        'id' => $this->id,
        'email' => $this->email,
        'name' => $this->name,
        'roles' => $this->ensureRolesArray($this->roles),
        'role' => $this->getPrimaryRole(), // Primary/active role
        ...
    ];
}

private function ensureRolesArray($roles)
{
    if (is_array($roles)) return $roles;
    return json_decode($roles ?? '["pegawai"]', true);
}

private function getPrimaryRole()
{
    $roles = $this->ensureRolesArray($this->roles);
    return $roles[0] ?? 'pegawai';
}
```

### PRIORITY 3 - FRONTEND CONSISTENCY 🟢

#### 3.1 Refactor Frontend Components

Ganti semua `currentUser.role` dengan helper functions:

```typescript
// ❌ SEBELUM
if (currentUser.role === 'admin_layanan') { ... }

// ✅ SESUDAH
import { userHasRole } from '@/lib/utils';
if (userHasRole(currentUser, 'admin_layanan')) { ... }
```

#### 3.2 Update Active Role Logic

```typescript
// Jangan hanya ambil role pertama
const activeRole =
  getActiveRole(currentUser.id) || getUserPrimaryRole(currentUser);

// Untuk permission check, pakai userHasRole
const canApprove =
  userHasRole(currentUser, "admin_layanan") ||
  userHasRole(currentUser, "super_admin");
```

---

## 📊 Impact Analysis

### Jika TIDAK Diperbaiki:

| Risk                | Severity    | Impact                                            |
| ------------------- | ----------- | ------------------------------------------------- |
| **Security Breach** | 🔴 CRITICAL | Pegawai bisa akses data users, BMN assets         |
| **Data Corruption** | 🔴 HIGH     | Non-admin bisa edit/delete critical data          |
| **Audit Failure**   | 🟡 MEDIUM   | Tidak bisa track siapa akses apa                  |
| **User Confusion**  | 🟢 LOW      | Multi-role users frustrated dengan limited access |
| **Code Debt**       | 🟡 MEDIUM   | Sulit maintenance, banyak duplikasi               |

### Jika Diperbaiki:

| Benefit                | Priority                                       |
| ---------------------- | ---------------------------------------------- |
| ✅ **API Security**    | Middleware enforce role-based access           |
| ✅ **Code Quality**    | DRY principle, pakai HasRoleHelper             |
| ✅ **User Experience** | Multi-role users bisa akses semua fitur mereka |
| ✅ **Auditability**    | 403 logs menunjukkan unauthorized attempts     |
| ✅ **Scalability**     | Mudah tambah role baru                         |

---

## 🎯 Implementation Roadmap

### Phase 1: Security (Week 1) 🔴

- [x] Analisis current implementation
- [ ] Buat CheckRole middleware
- [ ] Register middleware
- [ ] Apply ke routes super_admin
- [ ] Apply ke routes admin_layanan
- [ ] Testing security dengan Postman

### Phase 2: Backend Refactor (Week 2) 🟡

- [ ] Update TicketController pakai HasRoleHelper
- [ ] Update WorkOrderController pakai HasRoleHelper
- [ ] Update UserResource validation
- [ ] Update CommentController
- [ ] Unit testing untuk role checks

### Phase 3: Frontend Consistency (Week 3) 🟢

- [ ] Audit semua `currentUser.role` usage
- [ ] Replace dengan `userHasRole()` helper
- [ ] Update sidebar.tsx
- [ ] Update ticket-detail components
- [ ] Update user-management
- [ ] UI testing untuk multi-role scenarios

### Phase 4: Documentation (Week 4) 📚

- [ ] Document role hierarchy
- [ ] Document permission matrix
- [ ] Update API documentation
- [ ] Create role switching guide

---

## 📖 Role Permission Matrix (Recommended)

| Feature          | Pegawai | Teknisi     | Admin Penyedia | Admin Layanan | Super Admin |
| ---------------- | ------- | ----------- | -------------- | ------------- | ----------- |
| **Tickets**      |
| Create Ticket    | ✅      | ✅          | ✅             | ✅            | ✅          |
| View Own Tickets | ✅      | ✅          | ✅             | ✅            | ✅          |
| View All Tickets | ❌      | ⚠️ Assigned | ❌             | ✅            | ✅          |
| Approve Ticket   | ❌      | ❌          | ❌             | ✅            | ✅          |
| Assign Teknisi   | ❌      | ❌          | ❌             | ✅            | ✅          |
| Update Status    | ❌      | ⚠️ Assigned | ❌             | ✅            | ✅          |
| **Work Orders**  |
| View WO          | ❌      | ⚠️ Assigned | ✅             | ✅            | ✅          |
| Create WO        | ❌      | ✅          | ✅             | ✅            | ✅          |
| Approve WO       | ❌      | ❌          | ⚠️ Penyedia    | ✅            | ✅          |
| **Users**        |
| View Users       | ❌      | ❌          | ❌             | ⚠️ Limited    | ✅          |
| Create User      | ❌      | ❌          | ❌             | ❌            | ✅          |
| Update Roles     | ❌      | ❌          | ❌             | ❌            | ✅          |
| **BMN Assets**   |
| View Assets      | ❌      | ❌          | ❌             | ❌            | ✅          |
| Import/Export    | ❌      | ❌          | ❌             | ❌            | ✅          |
| **Zoom**         |
| Request Zoom     | ✅      | ✅          | ✅             | ✅            | ✅          |
| Approve Zoom     | ❌      | ❌          | ❌             | ✅            | ✅          |

---

## ✅ Checklist untuk Testing Multi-Role

Setelah perbaikan, test scenarios berikut:

### Backend API Testing

- [ ] Pegawai tidak bisa GET /api/users
- [ ] Pegawai tidak bisa POST /api/bmn-assets
- [ ] Teknisi bisa GET /api/tickets (hanya assigned)
- [ ] Admin Layanan bisa PATCH /api/tickets/{id}/approve
- [ ] Super Admin bisa akses semua endpoint
- [ ] 403 response menunjukkan required_roles
- [ ] Audit log mencatat 403 attempts

### Frontend UI Testing

- [ ] User dengan ["admin_layanan", "teknisi"] bisa switch role
- [ ] Sidebar menampilkan menu sesuai active role
- [ ] Permission checks bekerja untuk semua roles user
- [ ] Ticket list filter by role benar
- [ ] Action buttons muncul sesuai permission

### Multi-Role Scenarios

- [ ] User dengan ["pegawai", "teknisi"]:
  - Bisa create ticket sebagai pegawai
  - Bisa view assigned tickets sebagai teknisi
  - Bisa switch view antara kedua role
- [ ] User dengan ["admin_layanan", "super_admin"]:
  - Bisa approve tickets
  - Bisa manage users
  - Bisa manage BMN assets

---

## 🚨 Kesimpulan

**Multi-role system sudah 60% implemented** tapi masih ada **CRITICAL security gaps**:

1. ❌ **TIDAK ADA middleware authorization di backend** → **HIGHEST PRIORITY**
2. ⚠️ **Inkonsistensi penggunaan role checks** → Manual checks bukan pakai HasRoleHelper
3. ⚠️ **Frontend masih banyak pakai `user.role` langsung** → Tidak support multi-role sepenuhnya

**Rekomendasi:** **SEGERA implement CheckRole middleware** sebelum production. Tanpa ini, sistem vulnerable terhadap unauthorized access.

**Estimasi Effort:**

- Phase 1 (Security): **2-3 hari** ← START HERE
- Phase 2 (Refactor): 3-4 hari
- Phase 3 (Frontend): 3-4 hari
- Phase 4 (Docs): 1-2 hari
- **Total: 9-13 hari**

---

**Generated:** December 3, 2025  
**Analyst:** GitHub Copilot  
**Version:** 1.0
