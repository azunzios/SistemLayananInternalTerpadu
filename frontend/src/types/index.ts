// Type definitions for BPS NTB Ticketing System

export type UserRole = 'super_admin' | 'admin_layanan' | 'admin_penyedia' | 'teknisi' | 'user';

export type TicketType = 'perbaikan' | 'zoom_meeting';

export type TicketStatus = 
  // Perbaikan flow: Submitted → Assigned → In Progress → On Hold → Resolved → Waiting for User → Closed
  | 'submitted'        // Tiket baru diajukan
  | 'assigned'         // Ditugaskan ke teknisi
  | 'in_progress'      // Sedang dikerjakan teknisi
  | 'on_hold'          // Menunggu WO (sparepart/vendor)
  | 'resolved'         // Selesai diperbaiki
  | 'waiting_for_user' // Menunggu konfirmasi user
  | 'closed'           // Selesai & dikonfirmasi
  | 'closed_unrepairable' // Tidak dapat diperbaiki sama sekali
  // Zoom meeting flow
  | 'menunggu_review'
  | 'approved'
  | 'rejected'
  | 'dibatalkan';

export type UrgencyLevel = 'normal' | 'mendesak' | 'sangat_mendesak';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  nip: string;
  jabatan: string;
  role: UserRole; // Deprecated - use roles instead
  roles: UserRole[]; // Multi-role support
  unitKerja: string;
  phone: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TicketType;
  fields: CategoryField[];
  assignedRoles: UserRole[];
  createdAt: string;
}

export interface CategoryField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'file' | 'date' | 'email';
  required: boolean;
  options?: string[];
}

export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';
export type ProblemType = 'hardware' | 'software' | 'lainnya';

export interface Ticket {
  id: string;
  ticketNumber: string;
  type: TicketType;
  title: string;
  description: string;
  categoryId?: string;
  status: TicketStatus;
  priority: PriorityLevel; // P1-P4 untuk perbaikan
  urgency?: UrgencyLevel; // Deprecated, use priority
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  unitKerja?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  data: Record<string, any>;
  attachments: Attachment[];
  timeline: TimelineEvent[];
  
  // Perbaikan specific fields
  assetCode?: string;      // Kode Barang
  assetNUP?: string;        // NUP
  assetLocation?: string;   // Lokasi
  finalProblemType?: ProblemType; // Set by teknisi during diagnosa
  repairable?: boolean;     // false jika closed_unrepairable
  unrepairableReason?: string; // Alasan jika tidak dapat diperbaiki
  
  // Work Order reference
  workOrderId?: string;
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
  action: string;
  actor: string;
  details: string;
  attachments?: Attachment[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  quantity: number;
  location: string;
  condition: 'baru' | 'bekas_baik';
  minimumStock: number;
  minStock: number;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

// Work Order Types
export type WorkOrderType = 'sparepart' | 'vendor';
export type WorkOrderStatus = 'requested' | 'in_procurement' | 'delivered' | 'completed' | 'failed' | 'cancelled';

export interface WorkOrder {
  id: string;
  ticketId: string;
  ticketNumber?: string; // Ticket number for reference
  type: WorkOrderType;
  status: WorkOrderStatus;
  createdBy: string; // teknisi ID
  createdAt: string;
  updatedAt: string;
  
  // Simplified fields for sparepart
  itemName?: string; // Nama item sparepart (untuk sparepart type)
  quantity?: number; // Jumlah (untuk sparepart type)
  
  // Sparepart details (legacy, kept for backward compatibility)
  spareparts?: {
    name: string;
    qty: number;
    unit: string;
    remarks?: string;
  }[];
  
  // Vendor details
  vendorInfo?: {
    name?: string;
    contact?: string;
    description?: string;
    completionNotes?: string;
  };
  
  // Delivery/completion info
  receivedQty?: number;
  receivedRemarks?: string;
  completedAt?: string;
  failureReason?: string;
  
  timeline: TimelineEvent[];
}

// Kartu Kendali (Control Card) for Asset Maintenance History
export interface KartuKendali {
  id: string;
  assetCode: string; // kode barang
  assetNUP: string;  // NUP
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
  
  spareparts?: {
    name: string;
    qty: number;
    unit: string;
  }[];
  
  remarks?: string;
  createdAt: string;
}

export interface SparepartRequest {
  id: string;
  ticketId: string;
  items: {
    name: string;
    quantity: number;
    estimatedPrice: number;
    notes: string;
  }[];
  status: 'pending' | 'approved' | 'in_procurement' | 'ready' | 'delivered';
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
}

export interface ZoomBooking {
  id: string;
  ticketNumber: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  estimatedParticipants: number;
  coHosts: { name: string; email: string }[];
  breakoutRooms: number;
  category: string;
  unitKerja: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'dibatalkan' | 'completed';
  meetingLink?: string;
  meetingId?: string;
  passcode?: string;
  rejectionReason?: string;
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
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: string;
}