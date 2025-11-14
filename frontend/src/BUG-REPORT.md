# 🐛 BUG REPORT & KETIDAKKONSISTENAN SISTEM
## BPS NTB Ticketing System - Code Audit Report

**Tanggal**: 9 November 2025  
**Status**: ⚠️ REVIEW ONLY - BELUM DIPERBAIKI

---

## 🔴 CRITICAL BUGS

### 1. **INCONSISTENT STATUS VALUES - Type Definition vs Implementation**
**Severity**: 🔴 CRITICAL  
**Impact**: Type Safety Completely Broken

**Lokasi File**: 
- `/types/index.ts` (baris 7-21)
- Semua component files

**Masalah**:
Type definition mendefinisikan status dengan bahasa Inggris:
```typescript
export type TicketStatus = 
  | 'submitted'        // ❌ NOT USED
  | 'assigned'         // ❌ NOT USED
  | 'in_progress'      // ✅ USED
  | 'on_hold'          // ✅ USED
  | 'resolved'         // ✅ USED
  | 'menunggu_review'  // ✅ USED
  | 'approved'         // ✅ USED
```

**Tapi kode aktual menggunakan status dalam Bahasa Indonesia yang TIDAK ADA di type definition**:
- ✅ USED: `'disetujui'` - Digunakan di 15+ file
- ✅ USED: `'ditolak'` - Digunakan di 10+ file
- ✅ USED: `'ditugaskan'` - Digunakan di 8+ file
- ✅ USED: `'diterima_teknisi'` - Digunakan di 7+ file
- ✅ USED: `'sedang_diagnosa'` - Digunakan di 5+ file
- ✅ USED: `'dalam_perbaikan'` - Digunakan di 6+ file
- ✅ USED: `'selesai_diperbaiki'` - Digunakan di 4+ file
- ✅ USED: `'dalam_pengiriman'` - Digunakan di 3+ file

**Contoh Kode Bermasalah**:

File: `/components/ticket-detail.tsx` line 242-243
```typescript
const newStatus: TicketStatus = t.type === 'perbaikan'
  ? 'disetujui'  // ❌ ERROR: 'disetujui' is not assignable to type TicketStatus
  : 'approved';
```

File: `/components/ticket-detail.tsx` line 226
```typescript
ticket.status === 'disetujui'  // ❌ TypeScript should error, but doesn't catch
```

**Dampak**:
- ❌ TypeScript tidak bisa catch errors
- ❌ IDE autocomplete tidak akurat
- ❌ Risk of typo bugs
- ❌ Dokumentasi misleading

**File Terdampak**:
- ✅ `/components/ticket-detail.tsx`
- ✅ `/components/sidebar.tsx`
- ✅ `/components/admin-layanan-dashboard.tsx`
- ✅ `/components/teknisi-dashboard.tsx`
- ✅ `/components/my-tickets-view.tsx`
- ✅ `/components/super-admin-dashboard.tsx`
- ✅ `/lib/demo-data.ts`
- ✅ Dan 10+ file lainnya

---

### 2. **DUPLICATE ACTION BUTTONS di Alert Card & Action Section**
**Severity**: 🟡 MEDIUM  
**Impact**: Confusing UX, duplicate functionality

**Lokasi**: `/components/ticket-detail.tsx`

**Masalah**:
Ada 2 tempat yang menampilkan tombol Approve/Reject/Assign:

**TEMPAT 1: Alert Cards (BARIS ~1140-1203)**
```tsx
{/* ALERT CARD BIRU - Submitted */}
{currentUser.role === 'admin_layanan' && 
 ticket.type === 'perbaikan' &&
 ['submitted', 'menunggu_review'].includes(ticket.status) && (
  <Card className="border-blue-200 bg-blue-50">
    {/* Tombol TOLAK & SETUJUI */}
  </Card>
)}

{/* ALERT CARD HIJAU - Disetujui */}
{currentUser.role === 'admin_layanan' && 
 ticket.status === 'disetujui' && (
  <Card className="border-green-200 bg-green-50">
    {/* Tombol ASSIGN KE TEKNISI */}
  </Card>
)}
```

**TEMPAT 2: Action Buttons Section (BARIS ~1565-1601)**
```tsx
<div className="flex flex-wrap gap-2 pt-4">
  {canApprove && (
    <>
      <Button onClick={() => setShowRejectDialog(true)}>Tolak</Button>
      <Button onClick={() => setShowApproveDialog(true)}>Setujui</Button>
    </>
  )}
  {canAssign && (
    <Button onClick={() => setShowAssignDialog(true)}>Assign Teknisi</Button>
  )}
</div>
```

**Dampak**:
- ❌ User bingung, tombol muncul 2x
- ❌ Inconsistent dengan design guideline
- ⚠️ Tombol di header (baris 1095-1105) SUDAH DIHAPUS (fix dari request sebelumnya)

**Catatan**: 
- Alert Card lebih baik karena ada guidance text
- Action buttons section kurang informative

---

### 3. **PERMISSION LOGIC CHECKING NON-EXISTENT STATUS**
**Severity**: 🔴 HIGH  
**Impact**: Permission checks akan fail jika status tidak match

**Lokasi**: `/components/ticket-detail.tsx` line 222-231

```typescript
// ❌ Mengecek status yang tidak ada di type definition
const canApprove = currentUser.role === 'admin_layanan' && 
                   ['menunggu_review', 'submitted'].includes(ticket.status);

const canAssign = currentUser.role === 'admin_layanan' && 
                  ticket.type === 'perbaikan' && 
                  ticket.status === 'disetujui' &&  // ❌ 'disetujui' not in TicketStatus type
                  !ticket.assignedTo;

const canAcceptAsTeknisi = currentUser.role === 'teknisi' && 
                           ticket.assignedTo === currentUser.id && 
                           ['assigned', 'ditugaskan'].includes(ticket.status); // ❌ Mix English & Indo
```

**Masalah**:
- Status 'disetujui' tidak ada di type, tapi di-check
- Mix antara English ('assigned') dan Indo ('ditugaskan')
- Jika data actual use 'disetujui', tapi code check 'assigned', permission akan fail

---

### 4. **STATUS PROGRESSION TIDAK KONSISTEN**
**Severity**: 🟡 MEDIUM  
**Impact**: Developer confusion, documentation mismatch

**Dokumentasi di `/types/index.ts` line 8**:
```typescript
// Perbaikan flow: Submitted → Assigned → In Progress → On Hold → Resolved → Closed
```

**Actual Implementation di Code**:
```
submitted → disetujui → ditugaskan → diterima_teknisi → 
sedang_diagnosa → dalam_perbaikan → selesai_diperbaiki → 
resolved → closed
```

**Mismatch**:
- Dokumentasi: `Submitted → Assigned`
- Actual: `submitted → disetujui → ditugaskan`
- Dokumentasi pakai English, actual pakai Indo + Extra steps

---

## 🟡 MEDIUM BUGS

### 5. **SIDEBAR BADGE COUNT USING UNDEFINED STATUS**
**Severity**: 🟡 MEDIUM  
**Impact**: Badge might not show correct count

**Lokasi**: `/components/sidebar.tsx` line 194

```typescript
if (role === 'teknisi') {
  return t.assignedTo === currentUser.id && 
         ['ditugaskan', 'diterima_teknisi'].includes(t.status); // ❌ Not in type
}
```

**Masalah**:
- Menggunakan status 'ditugaskan' dan 'diterima_teknisi' yang tidak ada di TicketStatus type
- Jika data actual berbeda, badge count bisa salah

---

### 6. **MY TICKETS VIEW - STATUS CONFIG MISMATCH**
**Severity**: 🟡 MEDIUM  
**Impact**: Wrong status labels, progress bars

**Lokasi**: `/components/my-tickets-view.tsx` line 167-178

```typescript
const statusConfig = {
  disetujui: { label: 'Disetujui', ... },        // ❌ Not in type
  ditugaskan: { label: 'Ditugaskan', ... },      // ❌ Not in type
  diterima_teknisi: { label: 'Diterima', ... },  // ❌ Not in type
  sedang_diagnosa: { label: 'Diagnosa', ... },   // ❌ Not in type
  dalam_perbaikan: { label: 'Perbaikan', ... },  // ❌ Not in type
  // ... dll
}
```

**Masalah**:
- Semua status config menggunakan status yang tidak ada di type definition
- Progress percentage hardcoded, bisa jadi inaccurate

---

### 7. **TEKNISI DASHBOARD - STATUS FILTER INCONSISTENT**
**Severity**: 🟡 MEDIUM  
**Impact**: Tickets might not appear correctly

**Lokasi**: `/components/teknisi-dashboard.tsx` line 68-72

```typescript
const newAssignments = myTickets.filter(t => t.status === 'ditugaskan'); // ❌

const inDiagnosis = myTickets.filter(t => 
  ['diterima_teknisi', 'sedang_diagnosa'].includes(t.status) // ❌
);
```

**Masalah**:
- Filter menggunakan status yang tidak ada di type
- Jika ada typo atau status berubah, filter akan kosong

---

## 🟢 MINOR ISSUES

### 8. **ADMIN LAYANAN DASHBOARD - MIXED STATUS USAGE**
**Lokasi**: `/components/admin-layanan-dashboard.tsx` line 49-56

```typescript
return t.status === 'disetujui' && ...  // ❌ Not in type
totalRejected: tickets.filter(t => t.status === 'ditolak').length, // ❌ Not in type
```

---

### 9. **SUPER ADMIN DASHBOARD - STATUS ARRAY MISMATCH**
**Lokasi**: `/components/super-admin-dashboard.tsx` line 72, 114

```typescript
rejectedTickets: tickets.filter(t => 
  ['ditolak', 'rejected'].includes(t.status) // Mix Indo & English
).length,

// Line 114
['ditugaskan', 'dalam_perbaikan', 'diproses_persiapan_pengiriman'].includes(t.status)
```

---

### 10. **ZOOM CALENDAR VIEW - STATUS LABEL HARDCODED**
**Lokasi**: `/components/zoom-calendar-view.tsx` line 373

```typescript
{booking.status === 'approved' ? 'Disetujui' : 'Pending'}
// Should use statusConfig for consistency
```

---

## 📊 SUMMARY STATISTICS

### Status Usage Count (dari file search):
| Status (Indonesia) | Jumlah Penggunaan | Ada di Type? |
|-------------------|-------------------|--------------|
| `disetujui` | 15+ occurrences | ❌ NO |
| `ditolak` | 10+ occurrences | ❌ NO |
| `ditugaskan` | 8+ occurrences | ❌ NO |
| `diterima_teknisi` | 7+ occurrences | ❌ NO |
| `sedang_diagnosa` | 5+ occurrences | ❌ NO |
| `dalam_perbaikan` | 6+ occurrences | ❌ NO |
| `selesai_diperbaiki` | 4+ occurrences | ❌ NO |
| `dalam_pengiriman` | 3+ occurrences | ❌ NO |

### Status Usage (English) in Type Definition:
| Status (English) | Ada di Type? | Digunakan? |
|------------------|--------------|------------|
| `submitted` | ✅ YES | ⚠️ SOMETIMES (mixed with 'menunggu_review') |
| `assigned` | ✅ YES | ⚠️ RARELY (mostly use 'ditugaskan') |
| `in_progress` | ✅ YES | ✅ YES |
| `on_hold` | ✅ YES | ✅ YES |
| `resolved` | ✅ YES | ✅ YES |
| `closed` | ✅ YES | ✅ YES |

---

## 🎯 RECOMMENDED FIXES (PRIORITIZED)

### Priority 1: Fix Type Definition ⚠️ CRITICAL
**File**: `/types/index.ts`

**Option A - Add Indonesian Status** (Recommended):
```typescript
export type TicketStatus = 
  // Perbaikan workflow
  | 'submitted'           // Tiket baru (auto from form)
  | 'menunggu_review'     // = submitted (for zoom)
  | 'disetujui'           // Approved by Admin Layanan
  | 'ditolak'             // Rejected by Admin Layanan
  | 'ditugaskan'          // Assigned to Teknisi (= assigned)
  | 'diterima_teknisi'    // Accepted by Teknisi
  | 'sedang_diagnosa'     // Teknisi doing diagnosis
  | 'dalam_perbaikan'     // Teknisi repairing (= in_progress)
  | 'menunggu_sparepart'  // Waiting for sparepart WO
  | 'selesai_diperbaiki'  // Repair completed
  | 'in_progress'         // Generic in progress
  | 'on_hold'             // On hold (WO)
  | 'resolved'            // Resolved, waiting user confirm
  | 'closed'              // User confirmed, closed
  | 'closed_unrepairable' // Cannot be repaired
  // Zoom workflow
  | 'approved'            // Zoom approved
  | 'rejected'            // Zoom rejected
  | 'dibatalkan';         // Cancelled
```

**Option B - Standardize to English Only** (More work):
- Replace all 'disetujui' → 'approved'
- Replace all 'ditugaskan' → 'assigned'
- Replace all 'diterima_teknisi' → 'accepted'
- etc...

### Priority 2: Remove Duplicate Buttons
**File**: `/components/ticket-detail.tsx` line 1565-1601

Remove action buttons section, keep only alert cards.

### Priority 3: Fix Permission Logic
**File**: `/components/ticket-detail.tsx` line 222-231

Ensure all status checks use values from TicketStatus type.

### Priority 4: Update Documentation
**File**: `/types/index.ts` line 8

Update workflow documentation to match actual implementation:
```
submitted/menunggu_review → disetujui → ditugaskan → diterima_teknisi → 
sedang_diagnosa → dalam_perbaikan → selesai_diperbaiki → resolved → closed
```

---

## 🔍 FILES REQUIRING UPDATES (if fixing)

**High Priority**:
1. `/types/index.ts` - Add missing status values
2. `/components/ticket-detail.tsx` - Fix permission checks, remove duplicates
3. `/components/sidebar.tsx` - Fix badge logic
4. `/components/teknisi-dashboard.tsx` - Fix status filters
5. `/components/admin-layanan-dashboard.tsx` - Fix status filters

**Medium Priority**:
6. `/components/my-tickets-view.tsx` - Update status config
7. `/components/super-admin-dashboard.tsx` - Consistent status usage
8. `/lib/demo-data.ts` - Ensure demo data uses correct statuses

**Lower Priority**:
9. All dashboard components
10. All report components

---

## ⚠️ IMPACT ANALYSIS

### If NOT Fixed:
- ✅ **Application still works** - localStorage doesn't validate types
- ❌ **TypeScript safety broken** - No compile-time checks
- ❌ **Hard to maintain** - New devs will be confused
- ❌ **Risk of bugs** - Typos won't be caught
- ❌ **Documentation misleading** - Types don't match reality

### If Fixed:
- ✅ **Type safety restored**
- ✅ **Better IDE support**
- ✅ **Easier maintenance**
- ✅ **Less bugs**
- ⚠️ **Need extensive testing** - Many files affected

---

## 🧪 TESTING REQUIREMENTS (if fixing)

1. ✅ Test workflow: User create ticket → Admin approve → Assign teknisi
2. ✅ Test workflow: Teknisi accept → Diagnose → Repair → Complete
3. ✅ Test workflow: User confirm completion
4. ✅ Test workflow: Admin reject ticket
5. ✅ Test sidebar badge counts for all roles
6. ✅ Test dashboard statistics for all roles
7. ✅ Test zoom booking workflow
8. ✅ Test work order creation

---

**CATATAN AKHIR**: Sistem saat ini **BERFUNGSI** karena localStorage tidak validate types. Tapi untuk **maintainability jangka panjang**, type definition **HARUS** diperbaiki untuk match dengan implementation actual.

---

**Prepared by**: AI Assistant Code Auditor  
**Date**: 9 November 2025  
**Version**: 1.0.0
