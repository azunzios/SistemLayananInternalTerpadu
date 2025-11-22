// Route path constants
export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  
  // Protected routes - Main views
  HOME: '/',
  DASHBOARD: '/dashboard',
  
  // Ticket views
  CREATE_TICKET_PERBAIKAN: '/create-ticket-perbaikan',
  CREATE_TICKET_ZOOM: '/create-ticket-zoom',
  TICKETS: '/tickets',
  MY_TICKETS: '/my-tickets',
  TICKET_DETAIL: '/ticket-detail/:id',
  
  // Zoom views
  ZOOM_BOOKING: '/zoom-booking',
  ZOOM_MANAGEMENT: '/zoom-management',
  
  // Work Order views
  WORK_ORDERS: '/work-orders',
  
  // Admin views
  USERS: '/users',
  REPORTS: '/reports',
  
  // User views
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

// Route path type
export type RoutePath = typeof ROUTES[keyof typeof ROUTES];
