// type definition buat aplikasi ini
/* Catatan status tiket perbaikan
sebenarnya cuma ada 3 sekarang,
yaitu:
semua, pending, diproses, selesai

untuk semua:
semua status
pending: status==submitted

diproses:
status==assigned, in_progress, on_hold, waiting_for_submitter

selesai:
closed

untuk zoom:
pending: pending_review,
selesai: approved, rejected, cancelled

dan berikan juga arti arti status itu
*/


export type UserRole =
  | "super_admin"
  | "admin_layanan"
  | "admin_penyedia"
  | "teknisi"
  | "pegawai";

export type TicketType = "perbaikan" | "zoom_meeting";

export type PerbaikanStatus =
  | "pending_review"        // Menunggu review
  | "submitted"             // Tiket baru diajukan
  | "assigned"              // Ditugaskan ke teknisi
  | "in_progress"           // Sedang dikerjakan teknisi
  | "on_hold"               // Menunggu WO (sparepart/vendor)
  | "waiting_for_submitter" // Menunggu konfirmasi dari submitter/pegawai
  | "closed"                // Selesai & dikonfirmasi
  | "approved"              // Disetujui
  | "rejected";             // Ditolak

export type ZoomStatus = 
  | 'pending_review'   // Menggantikan 'menunggu_review' 
  | 'approved'         // Disetujui
  | 'rejected'         // Ditolak
  | 'cancelled'        // Menggantikan 'dibatalkan'
export type SeverityLevel = "low" | "normal" | "high" | "critical";

export type ProblemType = "hardware" | "software" | "lainnya";

export type RepairType =
  | "direct_repair"      // Bisa diperbaiki langsung
  | "need_sparepart"     // Butuh sparepart
  | "need_vendor"        // Butuh vendor
  | "need_license"       // Butuh lisensi
  | "unrepairable";      // Tidak dapat diperbaiki

export interface User {
  id: string;
  email: string;
  password?: string; // Optional on client; never returned in plaintext
  name: string;
  nip: string;
  jabatan: string;
  role: UserRole; // current Role saat ini
  roles: UserRole[]; // daftar role yang tersedia untuk akun tersebut, bisa saja array isinya cuma satu, value di role akan tetap masuk di roles.
  unitKerja: string;
  phone: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  action: string; // e.g., 'status_changed', 'comment_added', 'assigned'
  actor: string; // User name or ID
  details: string; // "Status diubah dari 'Submitted' ke 'Assigned'"
  attachments?: Attachment[];
}

// 1. Dibuat BaseTicket untuk field yang sama
interface BaseTicket {
  id: string;
  ticketNumber: string;
  type: TicketType; // Discriminator
  title: string;
  description: string;
  categoryId?: string;

  // Info Pengguna (denormalized)
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  unitKerja?: string;

  assignedTo?: string; // ID Teknisi (Perbaikan) or ID Admin (Zoom)
  createdAt: string;
  updatedAt: string;

  // Alasan penolakan (untuk semua tipe tiket)
  rejectionReason?: string;

  // Dibuat non-optional, tiket baru memiliki array kosong
  attachments: Attachment[];
  timeline: TimelineEvent[];

  // Comments count (for list views)
  commentsCount?: number;
}

// 2. Dibuat tipe spesifik untuk 'perbaikan'
export interface PerbaikanTicket extends BaseTicket {
  type: "perbaikan";
  status: PerbaikanStatus;
  severity: SeverityLevel; // Menggantikan 'priority'
  data: Record<string, any>; // Data dari dynamic form 'CategoryField'

  // Perbaikan specific fields
  assetCode?: string;
  assetNUP?: string;
  assetLocation?: string;
  finalProblemType?: ProblemType;
  repairable?: boolean;
  unrepairableReason?: string;

  workOrderId?: string; // Referensi ke Work Order (deprecated - use workOrders array)
  workOrders?: WorkOrder[]; // Array of work orders for this ticket

  // Diagnosis relationship
  diagnosis?: TicketDiagnosis;

  // Button status for workflow
  buttonStatus?: {
    ubahDiagnosis: {
      enabled: boolean;
      reason: string | null;
    };
    workOrder: {
      enabled: boolean;
      reason: string | null;
    };
    selesaikan: {
      enabled: boolean;
      reason: string | null;
    };
  };
}

// 3. Dibuat tipe spesifik untuk 'zoom_meeting'
export interface ZoomTicket extends BaseTicket {
  type: "zoom_meeting";
  status: ZoomStatus;

  // Field spesifik Zoom (dipindah dari ZoomBooking)
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  estimatedParticipants: number;
  coHosts: { name: string; email: string }[];
  breakoutRooms: number;

  // Info meeting (setelah approved)
  meetingLink?: string;
  meetingId?: string;
  passcode?: string;
  rejectionReason?: string;

  // Zoom account relationship
  zoomAccountId?: number;
  zoomAccount?: {
    id: number;
    accountId: string;
    name: string;
    email: string;
    hostKey?: string;
    color?: string;
  };

  // Suggested account untuk admin (dari auto-assign)
  suggestedAccountId?: number;
}

// 4. Tipe 'Ticket' utama sekarang adalah union yang type-safe
export type Ticket = PerbaikanTicket | ZoomTicket;

// BARU: Standarisasi struktur data sparepart
export interface SparepartItem {
  name: string;
  quantity: number; // Standarisasi menggunakan 'quantity'
  unit: string;
  remarks?: string; // Standarisasi menggunakan 'remarks' (menggantikan 'notes')
  estimatedPrice?: number;
}

// Work Order Types
export type WorkOrderType = "sparepart" | "vendor" | "license";
export type WorkOrderStatus =
  | "requested"
  | "in_procurement"
  | "completed"
  | "unsuccessful";
  
export interface WorkOrder {
  id: string;
  ticketId: string;
  ticketNumber?: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  createdBy: string; // teknisi ID
  createdByUser?: User;
  createdAt: string;
  updatedAt: string;

  // Sparepart details
  items?: any; // Can be array or JSON string
  spareparts?: SparepartItem[]; // Deprecated, use items instead

  // Vendor details (flattened structure from API)
  vendorName?: string;
  vendorContact?: string;
  vendorDescription?: string;

  // License details
  licenseName?: string;
  licenseDescription?: string;

  // Completion notes & failure reason
  completionNotes?: string;
  failureReason?: string;

  // Vendor details (old structure - for backwards compatibility)
  vendorInfo?: {
    name?: string;
    contact?: string;
    description?: string;
    completionNotes?: string;
  };

  // Ticket relation
  ticket?: Ticket;

  // Delivery/completion info
  completedAt?: string;

  timeline: TimelineEvent[];
}

// Kartu Kendali (Control Card) for Asset Maintenance History
export interface KartuKendali {
  id: string;
  assetCode: string; // kode barang
  assetNUP: string; // NUP
  assetName: string;
  createdAt: string;
  entries: KartuKendaliEntry[];
}

export interface KartuKendaliEntry {
  id: string;
  ticketId: string;
  workOrderId: string;
  date: string;
  createdBy: string; // Admin Penyedia ID

  vendorName?: string;
  vendorRef?: string;

  licenseName?: string;
  licenseDescription?: string;

  spareparts?: SparepartItem[]; // Items yang digunakan
  remarks?: string;
  createdAt: string;
}

// Ticket Diagnosis - Hasil diagnosa perbaikan barang
export interface TicketDiagnosis {
  id: string;
  ticketId: string;
  technicianId: string;

  // Teknisi info
  technician?: {
    id: string;
    name: string;
    email: string;
  };

  // Identifikasi masalah
  problem_description: string;
  problem_category: "hardware" | "software" | "lainnya";

  // Hasil diagnosis
  repair_type: RepairType;

  // Jika bisa diperbaiki langsung
  repair_description?: string;

  // Jika tidak dapat diperbaiki
  unrepairable_reason?: string;
  alternative_solution?: string;
  asset_condition_change?: string;

  // Catatan teknisi
  technician_notes?: string;

  // Estimasi pengerjaan
  estimasi_hari?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  link?: string; // e.g., '/ticket/T-12345'
  createdAt: string;
}
