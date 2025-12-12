// API-based storage management utilities for BPS NTB Ticketing System
// All data now managed through backend API - no localStorage

import React from "react";
import type {
  User,
  Ticket,
  Category,
  SparepartRequest,
  AuditLog,
  Notification,
  WorkOrder,
  KartuKendali,
  KartuKendaliEntry,
} from "../types";
import { api } from "./api";

// Valid roles from backend - must match backend enum
export const VALID_ROLES = [
  "super_admin",
  "admin_layanan",
  "admin_penyedia",
  "teknisi",
  "pegawai",
] as const;

export type ValidRole = (typeof VALID_ROLES)[number];

// Check if role is valid
export const isValidRole = (role: any): role is ValidRole => {
  return VALID_ROLES.includes(role);
};

// In-memory cache for synchronous getters (temporary until migration to async)
const cache = {
  currentUser: null as User | null,
  activeRole: new Map<string, string>(),
  tickets: [] as Ticket[],
  categories: [] as Category[],
  users: [] as User[],
  sparepartRequests: [] as SparepartRequest[],
  auditLogs: [] as AuditLog[],
  notifications: [] as Notification[],
  workOrders: [] as WorkOrder[],
  kartuKendali: [] as KartuKendali[],
};

const datasetLoaded: Record<
  "tickets" | "categories" | "users" | "workOrders" | "notifications",
  boolean
> = {
  tickets: false,
  categories: false,
  users: false,
  workOrders: false,
  notifications: false,
};

let isRefreshing = false; // Prevent duplicate refresh calls

// Pagination meta for tickets
interface TicketsMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  loading: boolean;
  pagesLoaded: Set<number>; // track which pages are in cache.tickets
}

const ticketsMeta: TicketsMeta = {
  total: 0,
  perPage: 15,
  currentPage: 1,
  lastPage: 1,
  loading: false,
  pagesLoaded: new Set<number>(),
};

// Reset all caches (useful on logout/login user switch)
export function resetAllCaches() {
  cache.currentUser = null;
  cache.activeRole = new Map<string, string>();
  cache.tickets = [];
  cache.categories = [];
  cache.users = [];
  cache.sparepartRequests = [];
  cache.auditLogs = [];
  cache.notifications = [];
  cache.workOrders = [];
  cache.kartuKendali = [];
  ticketsMeta.total = 0;
  ticketsMeta.currentPage = 1;
  ticketsMeta.lastPage = 1;
  ticketsMeta.pagesLoaded.clear();
  (Object.keys(datasetLoaded) as Array<keyof typeof datasetLoaded>).forEach(
    (key) => {
      datasetLoaded[key] = false;
    }
  );
}

export const getTicketsMeta = (): TicketsMeta => ({
  total: ticketsMeta.total,
  perPage: ticketsMeta.perPage,
  currentPage: ticketsMeta.currentPage,
  lastPage: ticketsMeta.lastPage,
  loading: ticketsMeta.loading,
  pagesLoaded: new Set(ticketsMeta.pagesLoaded),
});

// Load a single page of tickets (optionally filtered by type)
export async function loadTicketsPage(
  page: number = 1,
  opts?: { type?: string }
) {
  ticketsMeta.loading = true;
  try {
    const query: string[] = [];
    query.push(`page=${page}`);
    query.push(`per_page=${ticketsMeta.perPage}`);
    if (opts?.type) query.push(`type=${opts.type}`);
    const url = `tickets?${query.join("&")}`;
    const res: any = await api.get<any>(url).catch(() => ({}));
    const data = Array.isArray(res) ? res : res?.data || [];
    const meta = res?.meta || null;
    // Support Laravel Resource pagination (meta.total etc.) and classic paginator (top-level total)
    ticketsMeta.total = meta?.total ?? res?.total ?? data.length;
    ticketsMeta.currentPage = meta?.current_page ?? res?.current_page ?? page;
    ticketsMeta.lastPage = meta?.last_page ?? res?.last_page ?? page;
    ticketsMeta.perPage =
      meta?.per_page ?? res?.per_page ?? ticketsMeta.perPage;

    // Merge page data into cache (replace page segment)
    const pageNumber = page; // requested page (avoid relying on response current_page in case of transform)
    const pageSize = ticketsMeta.perPage;
    const startIndex = (pageNumber - 1) * pageSize;
    if (cache.tickets.length < startIndex + data.length) {
      cache.tickets.length = startIndex + data.length;
    }
    data.forEach((item: any, i: number) => {
      // Annotate with page for client-side navigation (non-persistent)
      cache.tickets[startIndex + i] = { ...item, __page: pageNumber };
    });
    ticketsMeta.pagesLoaded.add(pageNumber);
    datasetLoaded.tickets = true;
    return data as Ticket[];
  } finally {
    ticketsMeta.loading = false;
  }
}

// Reset tickets cache & meta
export function resetTicketsCache() {
  cache.tickets = [];
  ticketsMeta.total = 0;
  ticketsMeta.currentPage = 1;
  ticketsMeta.lastPage = 1;
  ticketsMeta.pagesLoaded.clear();
  datasetLoaded.tickets = false;
}

async function loadUsersFromApi(force = false): Promise<User[]> {
  if (!force && datasetLoaded.users && cache.users.length > 0) {
    return cache.users;
  }
  try {
    const res = await api.get<any>("users?per_page=100").catch(() => ({}));
    cache.users = Array.isArray(res) ? res : res?.data || [];
    datasetLoaded.users = true;
  } catch (err) {
    console.warn("Failed to load users from API", err);
    if (force) throw err;
  }
  return cache.users;
}

async function loadWorkOrdersFromApi(force = false): Promise<WorkOrder[]> {
  if (!force && datasetLoaded.workOrders && cache.workOrders.length > 0) {
    return cache.workOrders;
  }
  try {
    const res = await api
      .get<any>("work-orders?per_page=100")
      .catch(() => ({}));
    const raw = Array.isArray(res) ? res : res?.data || [];
    cache.workOrders = raw as WorkOrder[];
    datasetLoaded.workOrders = true;
  } catch (err) {
    console.warn("Failed to load work orders from API", err);
    if (force) throw err;
  }
  return cache.workOrders;
}

async function loadNotificationsFromApi(
  force = false
): Promise<Notification[]> {
  if (!force && datasetLoaded.notifications && cache.notifications.length > 0) {
    return cache.notifications;
  }
  try {
    const res = await api
      .get<any>("notifications?per_page=100")
      .catch(() => ({}));
    cache.notifications = Array.isArray(res) ? res : res?.data || [];
    datasetLoaded.notifications = true;
  } catch (err) {
    console.warn("Failed to load notifications from API", err);
    if (force) throw err;
  }
  return cache.notifications;
}

const datasetLoaders: Record<keyof typeof datasetLoaded, () => Promise<void>> =
{
  tickets: async () => {
    if (!datasetLoaded.tickets) {
      await loadTicketsPage(1);
    }
  },
  categories: async () => {
    // Categories API endpoint disabled - not used
    // await loadCategoriesFromApi();
  },
  users: async () => {
    await loadUsersFromApi();
  },
  workOrders: async () => {
    await loadWorkOrdersFromApi();
  },
  notifications: async () => {
    await loadNotificationsFromApi();
  },
};

const roleDatasetMap: Record<string, (keyof typeof datasetLoaded)[]> = {
  default: ["tickets"],
  pegawai: ["tickets"],
  admin_layanan: ["tickets", "users"],
  admin_penyedia: ["tickets", "users", "workOrders"],
  teknisi: ["tickets", "users"],
  super_admin: [
    "tickets",
    "users",
    "categories",
    "workOrders",
    "notifications",
  ],
};

export async function loadDataFromApiOnce(role: string = "pegawai") {
  const datasets = roleDatasetMap[role] || roleDatasetMap.default;
  const tasks = datasets
    .filter((dataset) => !datasetLoaded[dataset])
    .map((dataset) =>
      datasetLoaders[dataset]().catch((err) => {
        console.warn(`Failed to load dataset ${dataset} for role ${role}`, err);
      })
    );
  await Promise.all(tasks);
}

// Force refresh data from API (ignores cache)
export async function refreshTicketsFromApi() {
  if (isRefreshing) {
    console.log("Skipping duplicate refresh call");
    return;
  }
  isRefreshing = true;
  try {
    // Refresh only first page & meta; keep previously loaded other pages (could invalidate, but acceptable)
    await loadTicketsPage(1);
    console.log(
      "Tickets first page refreshed from API. Total:",
      ticketsMeta.total
    );
  } catch (err) {
    console.warn("Failed refreshing tickets from API", err);
  } finally {
    isRefreshing = false;
  }
}

// Load all zoom meeting tickets (for calendar view) without loading all ticket types
export async function loadAllZoomMeetingTickets() {
  const all: Ticket[] = [];
  let page = 1;
  while (true) {
    const res: any = await api
      .get<any>(`tickets?type=zoom_meeting&per_page=100&page=${page}`)
      .catch(() => ({}));
    const data = Array.isArray(res) ? res : res?.data || [];
    all.push(...data);
    const current = res?.current_page;
    const last = res?.last_page;
    if (!current || !last || current >= last) break;
    page += 1;
  }
  return all;
}

export const getZoomMeetingTickets = (): Ticket[] => {
  return cache.tickets.filter((t) => t.type === "zoom_meeting");
};

// Get ticket counts from backend (for dashboard metrics)
export async function getTicketCounts(type?: string): Promise<{
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  rejected: number;
}> {
  try {
    const query = type ? `?type=${type}` : "";
    const res = await api.get(`tickets-counts${query}`);
    return res as any;
  } catch (err) {
    console.error("Failed to fetch ticket counts:", err);
    return { total: 0, pending: 0, in_progress: 0, completed: 0, rejected: 0 };
  }
}

export { api } from "./api";

// No longer needed - backend handles initialization
export const initializeDefaultData = () => {
  console.log("Welcome to Sigap-ti!");
  console.log(React.version);
};

// ============================================
// User Management - Now via API
// ============================================

export const loginUser = async (
  email: string,
  password: string
): Promise<{ access_token: string; token_type: string; user: User }> => {
  try {
    const response = await api.post<{
      access_token: string;
      token_type: string;
      user: any;
    }>("login", {
      email,
      password,
    });

    // Store token for future requests
    if (response.access_token) {
      sessionStorage.setItem("auth_token", response.access_token);
      sessionStorage.setItem("token_type", response.token_type);
    }

    // Normalize user shape to match our User type (camelCase, required fields)
    // Normalize user shape to match our User type (camelCase, required fields)
    const raw = response.user || {};

    // Roles list from backend (array of strings)
    const roles: string[] = Array.isArray(raw.roles)
      ? raw.roles
      : raw.role
        ? [raw.role] // Fallback if roles array missing but role string exists
        : ['pegawai'];

    // Active role from backend (the single source of truth)
    const activeRole = raw.role || roles[0] || 'pegawai';

    // Validate that role from backend is in VALID_ROLES
    const validRoles = roles.filter((r) => isValidRole(r)) as ValidRole[];
    if (validRoles.length === 0) {
      console.warn("⚠️ Backend returned invalid role. Defaulting to pegawai");
      validRoles.push("pegawai");
    }

    const normalizedUser: User = {
      id: String(raw.id ?? ""),
      email: String(raw.email ?? ""),
      name: String(raw.name ?? ""),
      nip: String(raw.nip ?? ""),
      jabatan: String(raw.jabatan ?? ""),
      role: (isValidRole(activeRole) ? activeRole : 'pegawai') as any, // Active Role from DB
      roles: validRoles as any, // Available Roles from DB
      unitKerja: String(raw.unitKerja ?? raw.unit_kerja ?? ""),
      phone: String(raw.phone ?? ""),
      avatar: raw.avatar ?? undefined,
      createdAt: String(
        raw.createdAt ?? raw.created_at ?? new Date().toISOString()
      ),
      isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
      failedLoginAttempts: Number(
        raw.failedLoginAttempts ?? raw.failed_login_attempts ?? 0
      ),
      lockedUntil: raw.lockedUntil ?? raw.locked_until ?? undefined,
    };

    return {
      access_token: response.access_token,
      token_type: response.token_type,
      user: normalizedUser,
    };
  } catch (err) {
    console.error("Failed to login:", err);
    throw err;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const res = await api.get<any>("users?per_page=100");
    cache.users = Array.isArray(res) ? res : res?.data || [];
    datasetLoaded.users = true;
    return cache.users;
  } catch (err) {
    console.error("Failed to fetch users:", err);
    return cache.users;
  }
};

// Synchronous getter for cached users
export const getUsersSync = (): User[] => {
  return cache.users;
};

export const saveUsers = async (users: User[]) => {
  try {
    await api.put("users", users);
    cache.users = users;
    datasetLoaded.users = true;
  } catch (err) {
    console.error("Failed to save users:", err);
  }
};

export const getCurrentUser = (): User | null => {
  if (cache.currentUser) return cache.currentUser;
  try {
    const stored = sessionStorage.getItem("bps_current_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!parsed.jabatan) {
        parsed.jabatan = "";
      }
      cache.currentUser = parsed as User;
      return cache.currentUser;
    }
  } catch {
    // ignore parse errors
  }
  return null;
};

export const setCurrentUser = (user: User | null) => {
  cache.currentUser = user;
  if (user) {
    // Store in session for page refresh
    sessionStorage.setItem("bps_current_user", JSON.stringify(user));
  } else {
    sessionStorage.removeItem("bps_current_user");
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("token_type");
  }
};

// Active Role management - Now synced with Backend via API
export const getActiveRole = (userId?: string): string | null => {
  // Primary source is the User object itself
  const user = getCurrentUser();
  if (user && (!userId || user.id === userId)) {
    return user.role;
  }

  // Fallback to cache/session if user validation needs it loosely
  const key = userId || "default";
  return cache.activeRole.get(key) || sessionStorage.getItem(`bps_active_role_${key}`) || null;
};

export const setActiveRole = async (role: string, userId?: string) => {
  // 1. Call Backend API to update role
  try {
    await api.post('change-role', { role });
  } catch (e) {
    console.error("Failed to update role on backend", e);
    throw e; // Propagate error so UI knows it failed
  }

  // 2. Update Local State (Cache & Session)
  const key = userId || "default";
  cache.activeRole.set(key, role);
  sessionStorage.setItem(`bps_active_role_${key}`, role);

  // 3. Update Current User Object in Session
  const currentUser = getCurrentUser();
  if (currentUser) {
    const updatedUser = { ...currentUser, role: role as any };
    setCurrentUser(updatedUser);
  }
};

export const clearActiveRole = (userId?: string) => {
  const key = userId || "default";
  cache.activeRole.delete(key);
  sessionStorage.removeItem(`bps_active_role_${key}`);
};

// ============================================
// Ticket Management - Now via API
// ============================================

export const getTickets = (): Ticket[] => {
  return cache.tickets;
};

export const saveTickets = async (tickets: Ticket[]) => {
  cache.tickets = tickets;
  try {
    await api.put("tickets", tickets);
  } catch (err) {
    console.error("Failed to save tickets:", err);
  }
};

// ============================================
// Category Management - Now via API
// ============================================

export const getCategories = (): Category[] => {
  return cache.categories;
};

export const saveCategories = async (categories: Category[]) => {
  cache.categories = categories;
  datasetLoaded.categories = true;
  try {
    await api.put("categories", categories);
  } catch (err) {
    console.error("Failed to save categories:", err);
  }
};

// ============================================
// Sparepart Requests - Now via API
// ============================================

export const getSparepartRequests = (): SparepartRequest[] => {
  return cache.sparepartRequests;
};

export const saveSparepartRequests = async (requests: SparepartRequest[]) => {
  cache.sparepartRequests = requests;
  try {
    await api.put("sparepart-requests", requests);
  } catch (err) {
    console.error("Failed to save sparepart requests:", err);
  }
};

// ============================================
// Sparepart Requests - Now via API
// ============================================

export const getAuditLogs = (): AuditLog[] => {
  return cache.auditLogs;
};

export const addAuditLog = async (log: Omit<AuditLog, "id" | "timestamp">) => {
  const newLog: AuditLog = {
    ...log,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  } as any;
  cache.auditLogs = [...cache.auditLogs, newLog];
  try {
    await api.post("audit-logs", newLog);
  } catch (err) {
    console.error("Failed to save audit log:", err);
  }
};

// ============================================
// Notifications - Now via API
// ============================================

export const getNotifications = (userId: string): Notification[] => {
  if (!Array.isArray(cache.notifications)) {
    return [];
  }
  return cache.notifications.filter((n) => n.userId === userId);
};

export const saveNotifications = async (notifications: Notification[]) => {
  cache.notifications = notifications;
  datasetLoaded.notifications = true;
  try {
    await api.put("notifications", notifications);
  } catch (err) {
    console.error("Failed to save notifications:", err);
  }
};

export const addNotification = async (
  notification: Omit<Notification, "id" | "createdAt">
) => {
  const safeCache = Array.isArray(cache.notifications)
    ? cache.notifications
    : [];
  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  } as any;
  cache.notifications = [...safeCache, newNotification];
  datasetLoaded.notifications = true;
  try {
    await api.post("notifications", newNotification);
  } catch (err) {
    console.error("Failed to save notification:", err);
  }
};

// Alias for addNotification
export const createNotification = addNotification;

// ============================================
// Generate Ticket Number
// ============================================

export const generateTicketNumber = (type: string): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  const typePrefix =
    {
      permintaan_barang: "PB",
      perbaikan: "PR",
      zoom_meeting: "ZM",
    }[type] || "TK";

  return `TKT-${typePrefix}-${year}${month}${day}-${random}`;
};

// ============================================
// Remember Me Token - Now session-based
// ============================================

export const setRememberToken = (token: string, expiryDays: number = 30) => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + expiryDays);
  const tokenData = { token, expiry: expiry.toISOString() };
  sessionStorage.setItem("bps_remember_token", JSON.stringify(tokenData));
};

export const getRememberToken = (): string | null => {
  const tokenData = sessionStorage.getItem("bps_remember_token");
  if (!tokenData) return null;

  try {
    const { token, expiry } = JSON.parse(tokenData);
    if (new Date() > new Date(expiry)) {
      sessionStorage.removeItem("bps_remember_token");
      return null;
    }
    return token;
  } catch {
    return null;
  }
};

export const clearRememberToken = () => {
  sessionStorage.removeItem("bps_remember_token");
};

export const getAuthToken = (): string | null => {
  return sessionStorage.getItem("auth_token");
};

export const logoutUser = async (): Promise<void> => {
  try {
    await api.post("logout");
  } catch (err) {
    console.error("Logout failed:", err);
  } finally {
    setCurrentUser(null);
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("token_type");
    resetAllCaches();
  }
};

// ============================================
// Work Order Management - Now via API
// ============================================

export const getWorkOrders = (): WorkOrder[] => {
  return cache.workOrders;
};

export const saveWorkOrders = async (workOrders: WorkOrder[]) => {
  cache.workOrders = workOrders;
  datasetLoaded.workOrders = true;
  try {
    await api.put("work-orders", workOrders);
  } catch (err) {
    console.error("Failed to save work orders:", err);
  }
};

export const createWorkOrder = async (
  data: Partial<WorkOrder> & {
    ticketId: string;
    type: "sparepart" | "vendor";
    createdBy: string;
  }
) => {
  const spareparts = data.spareparts;
  const wo: WorkOrder = {
    id: `wo-${Date.now()}`,
    ticketId: data.ticketId!,
    type: data.type!,
    status: "requested",
    createdBy: data.createdBy!,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    spareparts,
    vendorInfo: data.vendorInfo,
    timeline: [
      {
        id: `tl-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "WORK_ORDER_CREATED",
        actor: data.createdBy!,
        details: `Work Order ${data.type} dibuat`,
      },
    ],
  } as any;

  cache.workOrders = [...cache.workOrders, wo];
  datasetLoaded.workOrders = true;

  try {
    await api.post("work-orders", wo);
  } catch (err) {
    console.error("Failed to create work order:", err);
  }

  return wo;
};

export const updateWorkOrder = async (
  id: string,
  updates: Partial<WorkOrder>
) => {
  const index = cache.workOrders.findIndex((wo) => wo.id === id);
  if (index !== -1) {
    cache.workOrders[index] = {
      ...cache.workOrders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    } as any;
    datasetLoaded.workOrders = true;

    try {
      await api.put(`work-orders/${id}`, cache.workOrders[index]);
    } catch (err) {
      console.error("Failed to update work order:", err);
    }

    return cache.workOrders[index];
  }
  return null;
};

export const getWorkOrdersByTicket = (ticketId: string): WorkOrder[] => {
  return cache.workOrders.filter((wo) => wo.ticketId === ticketId);
};

export const getWorkOrderById = (id: string): WorkOrder | undefined => {
  return cache.workOrders.find((wo) => wo.id === id);
};

// ============================================
// Kartu Kendali Management - Now via API
// ============================================

export const getKartuKendali = (): KartuKendali[] => {
  return cache.kartuKendali;
};

export const saveKartuKendali = async (kartuList: KartuKendali[]) => {
  cache.kartuKendali = kartuList;
  try {
    await api.put("kartu-kendali", kartuList);
  } catch (err) {
    console.error("Failed to save kartu kendali:", err);
  }
};

export const getKartuKendaliByAsset = (
  assetCode: string,
  assetNUP: string
): KartuKendali | undefined => {
  const kartuList = getKartuKendali();
  return kartuList.find(
    (k) => k.assetCode === assetCode && k.assetNUP === assetNUP
  );
};

export const createOrUpdateKartuKendali = async (
  assetCode: string,
  assetNUP: string,
  assetName: string,
  entry: KartuKendaliEntry
) => {
  const kartuList = getKartuKendali();
  let kartu = kartuList.find(
    (k) => k.assetCode === assetCode && k.assetNUP === assetNUP
  );

  if (!kartu) {
    // Create new kartu kendali
    kartu = {
      id: `kk-${Date.now()}`,
      assetCode,
      assetNUP,
      assetName,
      createdAt: new Date().toISOString(),
      entries: [],
    };
    kartuList.push(kartu);
  }

  // Add entry
  kartu.entries.push(entry);

  await saveKartuKendali(kartuList);
  return kartu;
};

// ==================== COMMENT/DISKUSI MANAGEMENT ====================

export interface Comment {
  id: number;
  ticket_id: string;
  parent_comment_id?: number | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  user_role: string;
  created_at: string;
  updated_at: string;
  replies?: Comment[]; // Nested replies (max 2 level)
}

export interface CommentsResponse {
  data: Comment[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

/**
 * Fetch comments/diskusi untuk ticket dengan pagination
 * Default 30 comments per halaman, newest first
 */
export async function getTicketComments(
  ticketId: string,
  page: number = 1,
  perPage: number = 30
): Promise<CommentsResponse> {
  try {
    const response = await api.get<CommentsResponse>(
      `/tickets/${ticketId}/comments?page=${page}&per_page=${perPage}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
}

/**
 * Create comment/percakapan baru pada ticket
 * @param parentCommentId optional, untuk reply ke comment lain (max 2 level)
 */
export async function createTicketComment(
  ticketId: string,
  content: string,
  parentCommentId?: number
): Promise<Comment> {
  try {
    const payload: any = { content };
    if (parentCommentId) {
      payload.parent_comment_id = parentCommentId;
    }
    const response = await api.post<Comment>(
      `/tickets/${ticketId}/comments`,
      payload
    );
    return response;
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
}
