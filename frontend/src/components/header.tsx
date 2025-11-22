import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import {
  Bell,
  LogOut,
  User,
  ChevronDown,
  Check,
  Clock,
  AlertCircle,
  RefreshCw,
  Menu,
  Building,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getNotifications, saveNotifications, getActiveRole, setActiveRole } from '../lib/storage';
import type { User as UserType, UserRole } from '../types';
import type { ViewType } from './main-layout';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { RoleSwitcherDialog } from './role-switcher-dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { API_BASE_URL } from '../lib/api';

interface HeaderProps {
  currentUser: UserType;
  onLogout: () => void;
  onNavigate: (view: ViewType) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onRoleSwitch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNavigate, sidebarCollapsed, onToggleSidebar, onRoleSwitch }) => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showRoleSwitchDialog, setShowRoleSwitchDialog] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = getNotifications(currentUser.id);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get current active role
  const activeRole = getActiveRole(currentUser.id) || currentUser.role;
  const availableRoles = currentUser.roles || [currentUser.role];
  const hasMultipleRoles = availableRoles.length > 1;

  const avatarUrl = React.useMemo(() => {
    if (!currentUser.avatar) return null;
    if (currentUser.avatar.startsWith('http')) return currentUser.avatar;
    const rawPath = currentUser.avatar.replace(/^\/?/, '');
    const cleanPath = rawPath.startsWith('storage/') ? rawPath : `storage/${rawPath}`;
    const fileBase = (API_BASE_URL || '').replace(/\/api$/i, '');
    return fileBase ? `${fileBase}/${cleanPath}` : `/${cleanPath}`;
  }, [currentUser.avatar]);

  const handleMarkAsRead = (notificationId: string) => {
    const allNotifications = getNotifications(currentUser.id);
    const updated = allNotifications.map((n: any) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    saveNotifications(updated);
    // Force re-render by closing and reopening
    setNotificationsOpen(false);
    setTimeout(() => setNotificationsOpen(true), 10);
  };

  const handleMarkAllAsRead = () => {
    const allNotifications = getNotifications(currentUser.id);
    const updated = allNotifications.map((n: any) => ({ ...n, read: true }));
    saveNotifications(updated);
    toast.success('Semua notifikasi ditandai sebagai dibaca');
    setNotificationsOpen(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
    toast.success('Anda berhasil logout');
    onLogout();
  };

  const handleRoleSwitchClick = () => {
    setShowRoleSwitchDialog(true);
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    setActiveRole(newRole, currentUser.id);
    toast.success(`Berhasil beralih ke ${newRole}`);
    // Trigger re-render via callback instead of reload
    if (onRoleSwitch) {
      onRoleSwitch();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return then.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 min-h-[72px]">
        <div className="flex items-center justify-between h-full">
          {/* Left side - Toggle and App Name */}
          <div className="flex items-center h-full">
            {/* Hamburger button container - sama dengan sidebar collapsed width (72px) */}
            <div className="w-[72px] px-3 flex items-center justify-center h-full">
              <Button
                variant="link"
                size="sm"
                onClick={onToggleSidebar}
                className="h-11 w-11 p-0 text-gray-700 hover:bg-blue-100 rounded-lg"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            {/* Separator */}
            <div className="w-px self-stretch bg-gray-200" />
            {/* App Name and Badge */}
            <div className="flex items-center gap-3 ml-4">
              <div className="h-9 w-9 bg-gradient-to-br rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <img src="/logo.svg" alt="BPS NTB logo" className="object-contain" />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-gray-900 leading-tight" style={{fontFamily: "var(--font-logo)"}}>SIGAP-TI</h1>
                  <p className="text-xs text-gray-500 leading-tight" style={{fontFamily: "var(--font-logo)"}}>BPS Provinsi Nusa Tenggara Barat</p>
                </div>
                <Badge variant="secondary" className="ml-2 bg-cyan-50 text-cyan-700 border-0 hover:bg-cyan-50">
                  {activeRole === 'super_admin' ? 'SUPER ADMIN' : 
                   activeRole === 'admin_layanan' ? 'ADMIN LAYANAN' :
                   activeRole === 'admin_penyedia' ? 'ADMIN PENYEDIA' :
                   activeRole === 'teknisi' ? 'TEKNISI' : 'PEGAWAI'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0" align="end">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifikasi</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                      >
                        Tandai semua dibaca
                      </Button>
                    )}
                  </div>
                </div>
                <ScrollArea className="h-96">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Tidak ada notifikasi</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map(notification => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50/50' : ''
                          }`}
                          onClick={() => {
                            handleMarkAsRead(notification.id);
                            if (notification.link) {
                              onNavigate(notification.link as ViewType);
                              setNotificationsOpen(false);
                            }
                          }}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {getRelativeTime(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-9 px-2.5 hover:bg-transparent">
                  <Avatar className="h-8 w-8">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={currentUser.name} />}
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-semibold">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 font-normal">{currentUser.email}</p>
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      {activeRole === 'super_admin' ? 'Super Admin' : 
                       activeRole === 'admin_layanan' ? 'Admin Layanan' :
                       activeRole === 'admin_penyedia' ? 'Admin Penyedia' :
                       activeRole === 'teknisi' ? 'Teknisi' : 'Pegawai'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profil Saya
                </DropdownMenuItem>
                {hasMultipleRoles && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleRoleSwitchClick}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Ganti Peran
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogoutClick} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari sistem? Anda perlu login kembali untuk mengakses sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogout} className="bg-red-600 hover:bg-red-700">
              Ya, Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Switch Confirmation Dialog */}
      <RoleSwitcherDialog
        open={showRoleSwitchDialog}
        onOpenChange={setShowRoleSwitchDialog}
        currentUser={currentUser}
        activeRole={activeRole}
        onRoleSwitch={handleRoleSwitch}
      />
    </>
  );
};
