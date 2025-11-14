import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import {
  LayoutDashboard,
  TicketIcon,
  Package,
  Wrench,
  Video,
  Users,
  BarChart3,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Building,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User, UserRole } from '../types';
import type { ViewType } from './main-layout';
import { getTickets, getNotifications, getActiveRole, getWorkOrders } from '../lib/storage';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface SidebarProps {
  currentUser: User;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  badge?: number;
  roles: string[];
  submenu?: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
}) => {
  const activeRole = getActiveRole(currentUser.id) || currentUser.role;
  const menuItems = getMenuItemsForRole(activeRole, currentUser);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin_layanan': return 'Admin Layanan';
      case 'admin_penyedia': return 'Admin Penyedia';
      case 'teknisi': return 'Teknisi';
      case 'user': return 'Pegawai';
      default: return role;
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{
        width: collapsed ? '72px' : '256px',
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col shadow-xl"
    >
      {/* Navigation Menu */}
      <ScrollArea className={`flex-1 py-4 ${collapsed ? 'px-3' : 'px-3'}`}>
        <nav className="space-y-1.5">
          <TooltipProvider delayDuration={100}>
            {menuItems.map(item => (
              <SidebarMenuItem
                key={item.id}
                item={item}
                currentView={currentView}
                collapsed={collapsed}
                onClick={() => onNavigate(item.id)}
              />
            ))}
          </TooltipProvider>
        </nav>
      </ScrollArea>
    </motion.aside>
  );
};

// Menu Item Component
interface SidebarMenuItemProps {
  item: MenuItem;
  currentView: ViewType;
  collapsed: boolean;
  onClick: () => void;
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  item,
  currentView,
  collapsed,
  onClick,
}) => {
  const isActive = currentView === item.id;
  const Icon = item.icon;

  const buttonContent = (
    <Button
      variant="ghost"
      className={`w-full ${collapsed ? 'h-11 p-2 justify-center' : 'h-11 justify-start px-4'} ${
        isActive
          ? 'bg-slate-700 text-white hover:bg-slate-600'
          : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
      } transition-colors`}
      onClick={onClick}
    >
      <Icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center justify-between flex-1 overflow-hidden"
          >
            <span className="truncate text-sm">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <Badge
                className={`ml-2 flex-shrink-0 text-xs ${
                  isActive 
                    ? 'bg-white text-slate-900' 
                    : 'bg-cyan-500 text-white'
                }`}
              >
                {item.badge}
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{buttonContent}</div>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-slate-900 text-white border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-sm">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <Badge className="bg-cyan-500 text-white text-xs">
                {item.badge}
              </Badge>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <div>{buttonContent}</div>;
};

type UserRole = 'super_admin' | 'admin_layanan' | 'admin_penyedia' | 'teknisi' | 'user';

const getMenuItemsForRole = (role: UserRole, currentUser: User): MenuItem[] => {
  const tickets = getTickets();
  const notifications = getNotifications(currentUser.id);
  const workOrders = getWorkOrders();

  // Calculate badges
  const pendingTicketsCount = tickets.filter(t => {
    if (role === 'admin_layanan') {
      return t.status === 'menunggu_review';
    }
    if (role === 'admin_penyedia') {
      return false; // Admin penyedia no longer has tickets to manage
    }
    if (role === 'teknisi') {
      return t.assignedTo === currentUser.id && ['ditugaskan', 'diterima_teknisi'].includes(t.status);
    }
    return false;
  }).length;

  const myTicketsCount = tickets.filter(t => t.userId === currentUser.id).length;
  const unreadNotifications = notifications.filter(n => !n.read).length;
  
  // Work order counts by role
  let workOrdersCount = 0;
  if (role === 'teknisi') {
    // Teknisi: count their own work orders that are in progress
    workOrdersCount = workOrders.filter(w => 
      w.createdBy === currentUser.id && 
      ['requested', 'in_procurement'].includes(w.status)
    ).length;
  } else if (role === 'admin_penyedia') {
    // Admin Penyedia: count pending work orders
    workOrdersCount = workOrders.filter(w => 
      ['requested', 'in_procurement'].includes(w.status)
    ).length;
  }

  // Define menu items based on roles
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'admin_layanan', 'admin_penyedia', 'teknisi', 'user'],
    },
    {
      id: 'create-ticket-perbaikan',
      label: 'Perbaikan Barang',
      icon: Wrench,
      roles: ['user'],
    },
    {
      id: 'zoom-booking',
      label: 'Booking Zoom',
      icon: Video,
      roles: ['user'],
    },
    {
      id: 'my-tickets',
      label: 'Tiket Saya',
      icon: TicketIcon,
      badge: myTicketsCount,
      roles: ['user', 'teknisi'],
    },
    {
      id: 'tickets',
      label: 'Kelola Tiket',
      icon: TicketIcon,
      badge: pendingTicketsCount,
      roles: ['super_admin', 'admin_layanan', 'admin_penyedia'],
    },
    {
      id: 'zoom-management',
      label: 'Kelola Zoom',
      icon: Video,
      roles: ['admin_layanan', 'super_admin'],
    },
    {
      id: 'work-orders',
      label: 'Work Order',
      icon: FolderKanban,
      badge: workOrdersCount,
      roles: ['admin_penyedia', 'teknisi'],
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      roles: ['super_admin'],
    },
    {
      id: 'reports',
      label: 'Laporan dan Kartu Kendali',
      icon: BarChart3,
      roles: ['super_admin', 'admin_penyedia'],
    },
  ];

  // Filter menu items based on user role
  return menuItems.filter(item =>
    item.roles.includes(role)
  );
};