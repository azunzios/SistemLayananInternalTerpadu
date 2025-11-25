# Components Structure Documentation

## 📁 New Folder Organization

Semua view/page components telah diorganisir ke dalam folder `views/` berdasarkan jenis halaman:

```
frontend/src/components/
├── ui/                          # UI components (button, card, dialog, etc)
├── views/                       # Page/View components
│   ├── dashboards/             # Dashboard views
│   │   ├── index.ts           # Dashboard exports
│   │   ├── dashboard.tsx       # Router dashboard
│   │   ├── user-dashboard.tsx
│   │   ├── super-admin-dashboard.tsx
│   │   ├── admin-layanan-dashboard.tsx
│   │   ├── admin-penyedia-dashboard.tsx
│   │   └── teknisi-dashboard.tsx
│   │
│   ├── tickets/                # Ticket management views
│   │   ├── index.ts           # Tickets exports
│   │   ├── create-ticket.tsx
│   │   ├── ticket-detail.tsx
│   │   ├── ticket-detail-alerts.tsx
│   │   ├── ticket-detail-info.tsx
│   │   ├── ticket-detail-utils.ts
│   │   ├── ticket-detail-hooks.ts
│   │   ├── ticket-list.tsx
│   │   ├── my-tickets-view.tsx
│   │   ├── ticket-progress-tracker.tsx
│   │   ├── ticket-progress-tracker-zoom.tsx
│   │   └── quick-ticket-dialog.tsx
│   │
│   ├── zoom/                   # Zoom meeting management views
│   │   ├── index.ts           # Zoom exports
│   │   ├── zoom-booking.tsx
│   │   ├── zoom-booking-types.ts
│   │   ├── zoom-management-view.tsx
│   │   ├── zoom-booking-management-tabs.tsx
│   │   ├── zoom-booking-user-tabs.tsx
│   │   ├── zoom-account-management.tsx
│   │   ├── zoom-admin-grid.tsx
│   │   ├── zoom-admin-review-modal.tsx
│   │   ├── zoom-calendar-view.tsx
│   │   ├── zoom-daily-grid.tsx
│   │   ├── zoom-monthly-calendar.tsx
│   │   ├── zoom-ticket-list.tsx
│   │   └── zoom-booking-dialogs/
│   │
│   ├── work-orders/            # Work order management views
│   │   ├── index.ts           # Work orders exports
│   │   ├── work-order-list.tsx
│   │   ├── teknisi-work-order-list.tsx
│   │   ├── admin-penyedia-work-order-list.tsx
│   │   ├── create-work-order-dialog.tsx
│   │   └── teknisi-workflow-new.tsx
│   │
│   ├── admin/                  # Admin management views
│   │   ├── index.ts           # Admin exports
│   │   ├── user-management.tsx
│   │   └── reports-view.tsx
│   │
│   └── shared/                 # Shared/common views
│       ├── index.ts           # Shared exports
│       ├── profile-settings.tsx
│       ├── user-onboarding.tsx
│       └── role-switcher-dialog.tsx
│
├── header.tsx                   # App header
├── sidebar.tsx                  # App sidebar
├── main-layout.tsx             # Main layout container
├── dashboard.tsx               # (deprecated - moved to views/dashboards)
└── login-page.tsx              # Login page
```

## 🎯 Mapping Menu Items ke Views

Dari `sidebar.tsx` menu items mapping ke views:

| Menu Item | Component | Path |
|-----------|-----------|------|
| Dashboard | Dashboard | `views/dashboards/dashboard.tsx` |
| Perbaikan Barang | CreateTicket | `views/tickets/create-ticket.tsx` |
| Booking Zoom | ZoomBooking | `views/zoom/zoom-booking.tsx` |
| Tiket Saya | MyTicketsView | `views/tickets/my-tickets-view.tsx` |
| Kelola Tiket | TicketList | `views/tickets/ticket-list.tsx` |
| Kelola Zoom | ZoomManagementView | `views/zoom/zoom-management-view.tsx` |
| Work Order | WorkOrderList | `views/work-orders/work-order-list.tsx` |
| User Management | UserManagement | `views/admin/user-management.tsx` |
| Laporan & K. Kendali | ReportsView | `views/admin/reports-view.tsx` |
| Profile | ProfileSettings | `views/shared/profile-settings.tsx` |

## 📝 Import Examples

### Before (Relative paths)
```typescript
import { TicketList } from './ticket-list';
import { Dashboard } from './dashboard';
import { getTickets } from '../lib/storage';
import type { User } from '../types';
```

### After (Using @ alias)
```typescript
import { TicketList } from '@/components/views/tickets';
import { Dashboard } from '@/components/views/dashboards';
import { getTickets } from '@/lib/storage';
import type { User } from '@/types';
```

## 🔍 Folder Structure Benefits

✅ **Better Organization**
- Mudah menemukan component berdasarkan fungsinya
- Clear hierarchy dan structure

✅ **Scalability**
- Ready untuk menambah sub-views baru
- Easy to maintain dan extend

✅ **Reusability**
- Index files untuk clean exports
- Easy to import dari module

✅ **Consistency**
- Semua imports menggunakan @ alias
- Standardized folder naming

✅ **Development Experience**
- Better IDE autocomplete
- Easier debugging
- Cleaner git history

## 🛠️ How to Add New View

### 1. Create new component
```bash
# Contoh: tambah 'Service Request' view ke tickets
touch src/components/views/tickets/service-request.tsx
```

### 2. Export di index.ts
```typescript
// src/components/views/tickets/index.ts
export { ServiceRequest } from './service-request';
```

### 3. Import di main-layout.tsx
```typescript
import { ServiceRequest } from '@/components/views/tickets';
```

### 4. Add menu item di sidebar.tsx
```typescript
{
  id: 'service-request',
  label: 'Service Request',
  icon: Wrench,
  roles: ['pegawai'],
}
```

### 5. Handle di main-layout case statement
```typescript
case 'service-request':
  return <ServiceRequest {...props} />;
```

## 📊 File Organization Summary

- **views/** - All user-facing pages (60+ files)
- **ui/** - Reusable UI components
- **routing/** - Route configuration
- **lib/** - Utilities and storage
- **Core files** - header, sidebar, main-layout, login-page

Total: 40+ dashboard/ticket/zoom/work-order/admin components organized in 5 view folders

## 🔄 Next Steps

All components are now organized and using consistent `@` alias imports. The structure is:
- ✅ Organized by feature/domain
- ✅ Using consistent import aliases
- ✅ Ready for scaling
- ✅ Easy to navigate and maintain
