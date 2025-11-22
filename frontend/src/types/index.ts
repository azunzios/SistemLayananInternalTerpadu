// type definition buat aplikasi ini

export type UserRole =
  | "super_admin"
  | "admin_layanan"
  | "admin_penyedia"
  | "teknisi"
  | "pegawai";

export type TicketType = "perbaikan" | "zoom_meeting";

export type PerbaikanStatus =
  | "submitted" // Tiket baru diajukan
  | "assigned" // Ditugaskan ke teknisi
  | "in_progress" // Sedang dikerjakan teknisi
  | "on_hold" // Menunggu WO (sparepart/vendor)
  | "resolved" // Selesai diperbaiki (oleh teknisi)
  | "waiting_for_user" // Menunggu konfirmasi user
  | "closed" // Selesai & dikonfirmasi
  | "closed_unrepairable" // Tidak dapat diperbaiki sama sekali
  | "rejected"; // Ditolak oleh admin layanan

export type ZoomStatus =
  | "pending_review" // Menggantikan 'menunggu_review' & 'pending_approval'
  | "approved" // Disetujui
  | "rejected" // Ditolak
  | "cancelled" // Menggantikan 'dibatalkan'
  | "completed"; // Acara zoom telah selesai

export type SeverityLevel = "low" | "normal" | "high" | "critical";

export type ProblemType = "hardware" | "software" | "lainnya";

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

export interface Category {
  id: string | number;
  name: string;
  type: TicketType; // Menentukan kategori ini untuk 'perbaikan' or 'zoom_meeting'
  fields?: CategoryField[]; // Optional - tidak selalu diperlukan tapi ada beberapa pertanyaan yang di (*) atau wajib dijawab
  assignedRoles?: UserRole[]; // Role yg menangani kategori ini
  isActive?: boolean;
  description?: string;
  createdAt?: string;
}

export interface CategoryField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "file" | "date" | "email";
  required: boolean;
  options?: string[];
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

  workOrderId?: string; // Referensi ke Work Order
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
export type WorkOrderType = "sparepart" | "vendor";
export type WorkOrderStatus =
  | "requested"
  | "in_procurement"
  | "delivered"
  | "completed"
  | "failed"
  | "cancelled";

export interface WorkOrder {
  id: string;
  ticketId: string;
  ticketNumber?: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  createdBy: string; // teknisi ID
  createdAt: string;
  updatedAt: string;
  spareparts?: SparepartItem[]; // Items dalam work order

  // Vendor details
  vendorInfo?: {
    name?: string;
    contact?: string;
    description?: string;
    completionNotes?: string;
  };

  // Delivery/completion info
  receivedQty?: number; // Mungkin bisa dihapus jika info ada di 'spareparts'
  receivedRemarks?: string;
  completedAt?: string;
  failureReason?: string;

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

  spareparts?: SparepartItem[]; // Items yang digunakan
  remarks?: string;
  createdAt: string;
}

export interface SparepartRequest {
  id: string;
  ticketId: string;

  spareparts: SparepartItem[];

  status: "pending" | "approved" | "in_procurement" | "ready" | "delivered";
  requestedBy: string; // Teknisi ID
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
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
