import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import {
  LayoutDashboard,
  TicketIcon,
  Wrench,
  Video,
  Users,
  BarChart3,
  FolderKanban
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User} from '@/types';
import type { ViewType } from './main-layout';
import { getActiveRole } from '@/lib/storage';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface SidebarProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  roles: string[];
  submenu?: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onNavigate,
  collapsed,
}) => {
  const location = useLocation();
  
  // Derive current view from URL pathname
  const getViewFromPath = (): ViewType => {
    const path = location.pathname.replace('/', '');
    if (path.startsWith('ticket-detail')) return 'ticket-detail';
    return (path || 'dashboard') as ViewType;
  };
  
  const currentView = getViewFromPath();
  const activeRole = getActiveRole(currentUser.id) || currentUser.role;
  const menuItems = getMenuItemsForRole(activeRole as any);

  return (
    <motion.aside
      initial={false}
      animate={{
        width: collapsed ? '72px' : '272px',
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="bg-[#f0f4f4f9] flex flex-col shadow-xl"
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
      variant="link"
      className={`w-full ${collapsed ? 'h-11 p-2 justify-center' : 'h-11 justify-start px-4'} ${
        isActive
          ? 'bg-slate-700 text-white hover:text-[#0842A0] hover:bg-[#D3E3FD]'
          : 'text-[#4444746] hover:text-[#0842A0] hover:bg-[#D3E3FD]'
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
          <span className="text-sm">{item.label}</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <div>{buttonContent}</div>;
};

type UserRole = 'super_admin' | 'admin_layanan' | 'admin_penyedia' | 'teknisi' | 'pegawai';

const getMenuItemsForRole = (role: UserRole): MenuItem[] => {

  // Define menu items based on roles
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'admin_layanan', 'admin_penyedia', 'teknisi', 'pegawai'],
    },
    {
      id: 'create-ticket-perbaikan',
      label: 'Perbaikan Barang',
      icon: Wrench,
      roles: ['pegawai'],
    },
    {
      id: 'zoom-booking',
      label: 'Booking Zoom',
      icon: Video,
      roles: ['pegawai'],
    },
    {
      id: 'my-tickets',
      label: 'Tiket Saya',
      icon: TicketIcon,
      roles: ['pegawai', 'teknisi'],
    },
    {
      id: 'tickets',
      label: 'Kelola Tiket',
      icon: TicketIcon,
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
      label: 'Laporan & K. Kendali',
      icon: BarChart3,
      roles: ['super_admin', 'admin_penyedia'],
    },
  ];

  // Filter menu items based on user role
  return menuItems.filter(item =>
    item.roles.includes(role)
  );
};