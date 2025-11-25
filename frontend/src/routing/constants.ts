// Route path constants with role parameter
export const ROUTES = {
  // Auth routes
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  
  // Protected routes with role - Main structure: /{role}/{menu}
  HOME: '/:role',
  DASHBOARD: '/:role/dashboard',
  
  // Ticket views
  CREATE_TICKET_PERBAIKAN: '/:role/create-ticket-perbaikan',
  CREATE_TICKET_ZOOM: '/:role/create-ticket-zoom',
  TICKETS: '/:role/tickets',
  MY_TICKETS: '/:role/my-tickets',
  TICKET_DETAIL: '/:role/ticket-detail/:id',
  
  // Zoom views
  ZOOM_BOOKING: '/:role/zoom-booking',
  ZOOM_MANAGEMENT: '/:role/zoom-management',
  
  // Work Order views
  WORK_ORDERS: '/:role/work-orders',
  
  // Admin views
  USERS: '/:role/users',
  REPORTS: '/:role/reports',
  
  // User views
  PROFILE: '/:role/profile',
  SETTINGS: '/:role/settings',
} as const;

// Valid user roles from backend
export const VALID_ROLES = [
  'super_admin',
  'admin_layanan',
  'admin_penyedia',
  'teknisi',
  'pegawai',
] as const;

export type UserRole = typeof VALID_ROLES[number];

// Helper function to build routes with actual role
export const buildRoute = (route: string, role: string, id?: string): string => {
  let path = route.replace(':role', role);
  if (id) {
    path = path.replace(':id', id);
  }
  return path;
};

// Validate if role is valid
export const isValidRole = (role: any): role is UserRole => {
  return VALID_ROLES.includes(role);
};

// Route path type
export type RoutePath = typeof ROUTES[keyof typeof ROUTES];
