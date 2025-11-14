// LocalStorage management utilities for BPS NTB Ticketing System

import { User, Ticket, Category, InventoryItem, SparepartRequest, ZoomBooking, AuditLog, Notification, WorkOrder, KartuKendali } from '../types';
import { seedDemoData } from './demo-data';

// Storage keys
const STORAGE_KEYS = {
  USERS: 'bps_ntb_users',
  CURRENT_USER: 'bps_ntb_current_user',
  ACTIVE_ROLE: 'bps_ntb_active_role',
  REMEMBER_TOKEN: 'bps_ntb_remember_token',
  TICKETS: 'bps_ntb_tickets',
  CATEGORIES: 'bps_ntb_categories',
  INVENTORY: 'bps_ntb_inventory',
  SPAREPART_REQUESTS: 'bps_ntb_sparepart_requests',
  ZOOM_BOOKINGS: 'bps_ntb_zoom_bookings',
  AUDIT_LOGS: 'bps_ntb_audit_logs',
  NOTIFICATIONS: 'bps_ntb_notifications',
  RESET_TOKENS: 'bps_ntb_reset_tokens',
  WORK_ORDERS: 'bps_ntb_work_orders',
  KARTU_KENDALI: 'bps_ntb_kartu_kendali',
  DEMO_INITIALIZED: 'bps_ntb_demo_initialized',
  DATA_VERSION: 'bps_ntb_data_version',
};

const CURRENT_DATA_VERSION = '3.0'; // Increment this to force re-initialization - New repair workflow

// Initialize default data with demo accounts
export const initializeDefaultData = () => {
  // Check data version
  const currentVersion = localStorage.getItem(STORAGE_KEYS.DATA_VERSION);
  const demoInitialized = localStorage.getItem(STORAGE_KEYS.DEMO_INITIALIZED);
  
  // Re-initialize if version changed or not initialized
  if (!demoInitialized || currentVersion !== CURRENT_DATA_VERSION) {
    console.log('🔄 Initializing demo data (version ' + CURRENT_DATA_VERSION + ')...');
    console.log('Previous version:', currentVersion);
    
    // Seed all demo data
    seedDemoData();
    
    // Mark as initialized with version
    localStorage.setItem(STORAGE_KEYS.DEMO_INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION);
    
    console.log('✅ Demo data initialized successfully!');
    console.log('📊 Tickets seeded:', JSON.parse(localStorage.getItem(STORAGE_KEYS.TICKETS) || '[]').length);
    console.log('📧 Demo Accounts:');
    console.log('   Super Admin: superadmin@bps-ntb.go.id / demo123');
    console.log('   Admin Layanan: adminlayanan@bps-ntb.go.id / demo123');
    console.log('   Admin Penyedia: adminpenyedia@bps-ntb.go.id / demo123');
    console.log('   Teknisi 1 (Andi): teknisi1@bps-ntb.go.id / demo123 [user-4]');
    console.log('   Teknisi 2 (Rudi): teknisi2@bps-ntb.go.id / demo123 [user-5]');
    console.log('   User 1: user1@bps-ntb.go.id / demo123');
    console.log('   User 2: user2@bps-ntb.go.id / demo123');
    console.log('   User 3: user3@bps-ntb.go.id / demo123');
    console.log('   🌟 Multi-Role 1: multirole1@bps-ntb.go.id / demo123 [Admin Layanan + Teknisi]');
    console.log('   🌟 Multi-Role 2: multirole2@bps-ntb.go.id / demo123 [Pegawai + Admin Penyedia]');
    console.log('   ⭐ MASTER ACCOUNT: master@bps-ntb.go.id / demo123 [ALL ROLES]');
    
    // Log ticket assignments for debugging
    const tickets = JSON.parse(localStorage.getItem(STORAGE_KEYS.TICKETS) || '[]');
    const perbaikanTickets = tickets.filter((t: any) => t.type === 'perbaikan');
    console.log('🔧 Tiket Perbaikan:', perbaikanTickets.length);
    perbaikanTickets.forEach((t: any) => {
      console.log(`   - ${t.ticketNumber}: assigned to ${t.assignedTo}, status: ${t.status}`);
    });
  }
};

// User management
export const getUsers = (): User[] => {
  const users = localStorage.getItem(STORAGE_KEYS.USERS);
  return users ? JSON.parse(users) : [];
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

// Active Role management for multi-role users
export const getActiveRole = (userId?: string): string | null => {
  if (!userId) {
    // Fallback to old behavior if no userId provided
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
  }
  return localStorage.getItem(`${STORAGE_KEYS.ACTIVE_ROLE}_${userId}`);
};

export const setActiveRole = (role: string, userId?: string) => {
  if (!userId) {
    // Fallback to old behavior if no userId provided
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
    return;
  }
  localStorage.setItem(`${STORAGE_KEYS.ACTIVE_ROLE}_${userId}`, role);
};

export const clearActiveRole = (userId?: string) => {
  if (!userId) {
    // Fallback to old behavior if no userId provided
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
    return;
  }
  localStorage.removeItem(`${STORAGE_KEYS.ACTIVE_ROLE}_${userId}`);
};

// Ticket management
export const getTickets = (): Ticket[] => {
  const tickets = localStorage.getItem(STORAGE_KEYS.TICKETS);
  if (!tickets) return [];
  
  const parsedTickets: Ticket[] = JSON.parse(tickets);
  
  // Migration: Ensure all tickets have required fields
  const migratedTickets = parsedTickets.map(ticket => ({
    ...ticket,
    attachments: ticket.attachments || [],
    timeline: ticket.timeline || [
      {
        id: `tl-${ticket.id}-1`,
        timestamp: ticket.createdAt,
        action: 'CREATED',
        actor: ticket.userId,
        details: 'Tiket dibuat',
      },
    ],
  }));
  
  // Save migrated data if changes were made
  if (JSON.stringify(parsedTickets) !== JSON.stringify(migratedTickets)) {
    saveTickets(migratedTickets);
  }
  
  return migratedTickets;
};

export const saveTickets = (tickets: Ticket[]) => {
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
};

// Category management
export const getCategories = (): Category[] => {
  const categories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  return categories ? JSON.parse(categories) : [];
};

export const saveCategories = (categories: Category[]) => {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
};

// Inventory management
export const getInventory = (): InventoryItem[] => {
  const inventory = localStorage.getItem(STORAGE_KEYS.INVENTORY);
  return inventory ? JSON.parse(inventory) : [];
};

export const saveInventory = (inventory: InventoryItem[]) => {
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
};

// Sparepart requests
export const getSparepartRequests = (): SparepartRequest[] => {
  const requests = localStorage.getItem(STORAGE_KEYS.SPAREPART_REQUESTS);
  return requests ? JSON.parse(requests) : [];
};

export const saveSparepartRequests = (requests: SparepartRequest[]) => {
  localStorage.setItem(STORAGE_KEYS.SPAREPART_REQUESTS, JSON.stringify(requests));
};

// Zoom bookings
export const getZoomBookings = (): ZoomBooking[] => {
  const bookings = localStorage.getItem(STORAGE_KEYS.ZOOM_BOOKINGS);
  return bookings ? JSON.parse(bookings) : [];
};

export const saveZoomBookings = (bookings: ZoomBooking[]) => {
  localStorage.setItem(STORAGE_KEYS.ZOOM_BOOKINGS, JSON.stringify(bookings));
};

// Audit logs
export const getAuditLogs = (): AuditLog[] => {
  const logs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
  return logs ? JSON.parse(logs) : [];
};

export const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    ...log,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };
  logs.push(newLog);
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
};

// Notifications
export const getNotifications = (userId: string): Notification[] => {
  const notifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  if (!notifications) return [];
  
  const parsed = JSON.parse(notifications);
  
  // Migration: Check if old object format (Record<string, Notification[]>)
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    // Convert old object format to array format
    const migratedNotifications: Notification[] = [];
    Object.values(parsed).forEach((userNotifs: any) => {
      if (Array.isArray(userNotifs)) {
        migratedNotifications.push(...userNotifs);
      }
    });
    // Save migrated data
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(migratedNotifications));
    return migratedNotifications.filter(n => n.userId === userId);
  }
  
  // Normal array format
  const allNotifications: Notification[] = Array.isArray(parsed) ? parsed : [];
  return allNotifications.filter(n => n.userId === userId);
};

export const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

export const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
  const notifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  let allNotifications: Notification[] = [];
  
  if (notifications) {
    const parsed = JSON.parse(notifications);
    
    // Migration: Check if old object format
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      Object.values(parsed).forEach((userNotifs: any) => {
        if (Array.isArray(userNotifs)) {
          allNotifications.push(...userNotifs);
        }
      });
    } else if (Array.isArray(parsed)) {
      allNotifications = parsed;
    }
  }
  
  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  allNotifications.push(newNotification);
  saveNotifications(allNotifications);
};

// Alias for addNotification
export const createNotification = addNotification;

// Generate ticket number
export const generateTicketNumber = (type: string): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  const typePrefix = {
    permintaan_barang: 'PB',
    perbaikan: 'PR',
    zoom_meeting: 'ZM',
  }[type] || 'TK';
  
  return `TKT-${typePrefix}-${year}${month}${day}-${random}`;
};

// Remember me token management
export const setRememberToken = (token: string, expiryDays: number = 30) => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + expiryDays);
  const tokenData = { token, expiry: expiry.toISOString() };
  localStorage.setItem(STORAGE_KEYS.REMEMBER_TOKEN, JSON.stringify(tokenData));
};

export const getRememberToken = (): string | null => {
  const tokenData = localStorage.getItem(STORAGE_KEYS.REMEMBER_TOKEN);
  if (!tokenData) return null;
  
  const { token, expiry } = JSON.parse(tokenData);
  if (new Date() > new Date(expiry)) {
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_TOKEN);
    return null;
  }
  
  return token;
};

export const clearRememberToken = () => {
  localStorage.removeItem(STORAGE_KEYS.REMEMBER_TOKEN);
};

// ============================================
// Work Order Management
// ============================================

export const getWorkOrders = (): WorkOrder[] => {
  const data = localStorage.getItem(STORAGE_KEYS.WORK_ORDERS);
  return data ? JSON.parse(data) : [];
};

export const saveWorkOrders = (workOrders: WorkOrder[]) => {
  localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify(workOrders));
};

export const createWorkOrder = (data: Partial<WorkOrder> & { ticketId: string; type: 'sparepart' | 'vendor'; createdBy: string }) => {
  const workOrder: WorkOrder = {
    id: `wo-${Date.now()}`,
    ticketId: data.ticketId,
    type: data.type,
    status: 'requested',
    createdBy: data.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    spareparts: data.spareparts,
    vendorInfo: data.vendorInfo,
    timeline: [{
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'WORK_ORDER_CREATED',
      actor: data.createdBy,
      details: `Work Order ${data.type} dibuat`,
    }],
  };
  
  const workOrders = getWorkOrders();
  workOrders.push(workOrder);
  saveWorkOrders(workOrders);
  return workOrder;
};

export const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => {
  const workOrders = getWorkOrders();
  const index = workOrders.findIndex(wo => wo.id === id);
  if (index !== -1) {
    workOrders[index] = { ...workOrders[index], ...updates, updatedAt: new Date().toISOString() };
    saveWorkOrders(workOrders);
    return workOrders[index];
  }
  return null;
};

export const getWorkOrdersByTicket = (ticketId: string): WorkOrder[] => {
  const workOrders = getWorkOrders();
  return workOrders.filter(wo => wo.ticketId === ticketId);
};

export const getWorkOrderById = (id: string): WorkOrder | undefined => {
  const workOrders = getWorkOrders();
  return workOrders.find(wo => wo.id === id);
};

// ============================================
// Kartu Kendali Management
// ============================================

export const getKartuKendali = (): KartuKendali[] => {
  const data = localStorage.getItem(STORAGE_KEYS.KARTU_KENDALI);
  return data ? JSON.parse(data) : [];
};

export const saveKartuKendali = (kartuList: KartuKendali[]) => {
  localStorage.setItem(STORAGE_KEYS.KARTU_KENDALI, JSON.stringify(kartuList));
};

export const getKartuKendaliByAsset = (assetCode: string, assetNUP: string): KartuKendali | undefined => {
  const kartuList = getKartuKendali();
  return kartuList.find(k => k.assetCode === assetCode && k.assetNUP === assetNUP);
};

export const createOrUpdateKartuKendali = (assetCode: string, assetNUP: string, assetName: string, entry: KartuKendaliEntry) => {
  const kartuList = getKartuKendali();
  let kartu = kartuList.find(k => k.assetCode === assetCode && k.assetNUP === assetNUP);
  
  if (!kartu) {
    // Create new kartu kendali
    kartu = {
      id: `kk-${Date.now()}`,
      assetCode,
      assetNUP,
      assetName,
      createdAt: new Date().toISOString(),
      entries: []
    };
    kartuList.push(kartu);
  }
  
  // Add entry
  kartu.entries.push(entry);
  
  saveKartuKendali(kartuList);
  return kartu;
};