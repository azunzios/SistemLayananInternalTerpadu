# Routing Structure Documentation

## 📁 Folder Structure

```
frontend/src/routing/
├── index.ts                    # Main routing exports
├── constants.ts                # Route path constants
├── guards/                     # Route protection guards
│   ├── index.ts               # Guards exports
│   ├── ProtectedRoute.tsx     # Guard untuk authenticated routes
│   └── PublicRoute.tsx        # Guard untuk public routes (redirect jika sudah login)
└── routes/                     # Route configurations
    ├── index.ts               # Routes exports
    └── AppRouter.tsx          # Main router with all route definitions
```

## 🎯 Design Patterns

### 1. **Separation of Concerns**
- `guards/` - Logika proteksi route
- `routes/` - Konfigurasi dan definisi route
- `constants.ts` - Centralized route paths

### 2. **Constants Pattern**
Semua route paths disimpan di `constants.ts`:
```typescript
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  HOME: '/',
} as const;
```

**Keuntungan:**
- Type-safe route paths
- Single source of truth
- Easy refactoring
- Autocomplete support

### 3. **Guard Pattern**
Route guards untuk control access:

**ProtectedRoute**: Hanya bisa diakses jika sudah login
```typescript
<ProtectedRoute user={currentUser}>
  <Dashboard />
</ProtectedRoute>
```

**PublicRoute**: Redirect ke dashboard jika sudah login
```typescript
<PublicRoute user={currentUser}>
  <LoginPage />
</PublicRoute>
```

## 📝 Usage Examples

### Import Routes
```typescript
import { ROUTES } from '@/routing';

// Navigate programmatically
navigate(ROUTES.DASHBOARD);
navigate(ROUTES.LOGIN);
```

### Import Guards
```typescript
import { ProtectedRoute, PublicRoute } from '@/routing/guards';
```

### Import Router
```typescript
import { AppRouter } from '@/routing';
```

## 🔄 Route Flow

### Login Flow
1. User di `/login` (PublicRoute)
2. Submit credentials
3. On success → `navigate(ROUTES.DASHBOARD)`
4. PublicRoute detects user → auto redirect ke dashboard

### Logout Flow
1. User di `/dashboard` (ProtectedRoute)
2. Click logout
3. Clear session
4. `navigate(ROUTES.LOGIN)`
5. ProtectedRoute detects no user → stay at login

### Auto Redirect
- Access `/dashboard` tanpa login → redirect ke `/login`
- Access `/login` saat sudah login → redirect ke `/dashboard`
- Access `/` → redirect based on login status

## 🚀 Extending Routes

### Menambah Route Baru

1. **Tambah constant** di `constants.ts`:
```typescript
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',  // ← New
  HOME: '/',
} as const;
```

2. **Tambah route** di `AppRouter.tsx`:
```typescript
<Route
  path={ROUTES.PROFILE}
  element={
    <ProtectedRoute user={currentUser}>
      <ProfilePage />
    </ProtectedRoute>
  }
/>
```

### Menambah Guard Baru

Buat file baru di `guards/`:
```typescript
// guards/AdminRoute.tsx
export const AdminRoute: React.FC<Props> = ({ user, children }) => {
  if (!user || user.role !== 'admin') {
    return <Navigate to={ROUTES.HOME} />;
  }
  return <>{children}</>;
};
```

Export di `guards/index.ts`:
```typescript
export { AdminRoute } from './AdminRoute';
```

## 🎨 Best Practices

1. **Always use ROUTES constants**, jangan hardcode path
   ```typescript
   // ✅ Good
   navigate(ROUTES.DASHBOARD);
   
   // ❌ Bad
   navigate('/dashboard');
   ```

2. **Guards should be simple** - hanya fokus ke authorization logic

3. **Keep route config in AppRouter** - jangan split ke banyak file kecuali kompleks

4. **Type-safe everything** - gunakan TypeScript types yang provided

## 📊 Benefits of This Structure

- ✅ **Scalable**: Mudah tambah route baru
- ✅ **Maintainable**: Clear separation of concerns
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Reusable**: Guards bisa dipakai ulang
- ✅ **Centralized**: Single source of truth untuk paths
- ✅ **Testable**: Easy to unit test guards dan routes
