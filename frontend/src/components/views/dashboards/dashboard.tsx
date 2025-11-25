import React from 'react';
import { UserDashboard } from './user-dashboard';
import { SuperAdminDashboard } from './super-admin-dashboard';
import { AdminLayananDashboard } from './admin-layanan-dashboard';
import { AdminPenyediaDashboard } from './admin-penyedia-dashboard';
import { TeknisiDashboard } from './teknisi-dashboard';
import { getActiveRole } from '@/lib/storage';
import type { User } from '@/types';
import type { ViewType } from '@/components/main-layout';

interface DashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
  onViewTicket: (ticketId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, onNavigate, onViewTicket }) => {
  // Get active role for multi-role users
  const activeRole = getActiveRole(currentUser.id) || currentUser.role;
  
  // Route to appropriate dashboard based on active role
  switch (activeRole) {
    case 'super_admin':
      return <SuperAdminDashboard currentUser={currentUser} onNavigate={onNavigate} />;
    
    case 'admin_layanan':
      return <AdminLayananDashboard currentUser={currentUser} onNavigate={onNavigate} onViewTicket={onViewTicket} />;
    
    case 'admin_penyedia':
      return <AdminPenyediaDashboard currentUser={currentUser} onNavigate={onNavigate} />;
    
    case 'teknisi':
      return <TeknisiDashboard currentUser={currentUser} onNavigate={onNavigate} />;
    
    case 'pegawai':
    default:
      return <UserDashboard currentUser={currentUser} onNavigate={onNavigate} />;
  }
};