import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Dashboard } from './dashboard';
import { CreateTicket } from './create-ticket';
import { TicketList } from './ticket-list';
import { TicketDetail } from './ticket-detail';
import { ZoomBooking } from './zoom-booking';
import { ZoomManagementView } from './zoom-management-view';
import { UserManagement } from './user-management';
import { InventoryManagement } from './inventory-management';
import { ProfileSettings } from './profile-settings';
import { ReportsView } from './reports-view';
import { WorkOrderList } from './work-order-list';
import { TeknisiWorkOrderList } from './teknisi-work-order-list';
import { MyTicketsView } from './my-tickets-view';
import { getActiveRole } from '../lib/storage';
import type { User } from '../types';

interface MainLayoutProps {
  currentUser: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

export type ViewType = 
  | 'dashboard'
  | 'create-ticket-perbaikan'
  | 'create-ticket-zoom'
  | 'tickets'
  | 'my-tickets'
  | 'ticket-detail'
  | 'zoom-booking'
  | 'zoom-management'
  | 'users'
  | 'inventory'
  | 'work-orders'
  | 'reports'
  | 'profile'
  | 'settings';

export const MainLayout: React.FC<MainLayoutProps> = ({ currentUser, onLogout, onUserUpdate }) => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNavigate = (view: ViewType, ticketId?: string) => {
    setCurrentView(view);
    if (ticketId) {
      setSelectedTicketId(ticketId);
    }
  };

  const handleRoleSwitch = () => {
    // Force re-render when role is switched
    setRefreshKey(prev => prev + 1);
    setCurrentView('dashboard');
    setSelectedTicketId(null);
  };

  const handleViewTicketDetail = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setCurrentView('ticket-detail');
  };

  const handleBackToList = () => {
    setCurrentView(currentUser.role === 'user' ? 'my-tickets' : 'tickets');
    setSelectedTicketId(null);
  };

  const renderContent = () => {
    // Get active role untuk permission check
    const activeRole = getActiveRole(currentUser.id) || currentUser.role;
    
    switch (currentView) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} onNavigate={handleNavigate} onViewTicket={handleViewTicketDetail} />;

      case 'create-ticket-perbaikan':
        return (
          <CreateTicket
            currentUser={currentUser}
            ticketType="perbaikan"
            onTicketCreated={() => handleNavigate('my-tickets')}
            onCancel={() => handleNavigate('dashboard')}
          />
        );

      case 'create-ticket-zoom':
        return (
          <CreateTicket
            currentUser={currentUser}
            ticketType="zoom_meeting"
            onTicketCreated={() => handleNavigate('my-tickets')}
            onCancel={() => handleNavigate('dashboard')}
          />
        );

      case 'tickets':
        return (
          <TicketList
            currentUser={currentUser}
            viewMode="all"
            onViewTicket={handleViewTicketDetail}
          />
        );

      case 'my-tickets':
        return (
          <MyTicketsView
            currentUser={currentUser}
            onViewTicket={handleViewTicketDetail}
          />
        );

      case 'ticket-detail':
        if (!selectedTicketId) {
          handleNavigate('tickets');
          return null;
        }
        return (
          <TicketDetail
            ticketId={selectedTicketId}
            currentUser={currentUser}
            onBack={handleBackToList}
            onNavigate={handleNavigate}
          />
        );

      case 'zoom-booking':
        return (
          <ZoomBooking
            currentUser={currentUser}
            isManagement={false}
            onNavigate={handleNavigate}
          />
        );

      case 'zoom-management':
        // Only Admin Layanan and Super Admin can access Zoom Management
        if (activeRole !== 'admin_layanan' && activeRole !== 'super_admin') {
          handleNavigate('dashboard');
          return null;
        }
        return <ZoomManagementView onNavigate={handleNavigate} onViewTicket={handleViewTicketDetail} />;

      case 'users':
        // Only Super Admin can access User Management
        if (activeRole !== 'super_admin') {
          handleNavigate('dashboard');
          return null;
        }
        return <UserManagement currentUser={currentUser} />;

      case 'inventory':
        // Only Super Admin can access Inventory
        if (activeRole !== 'super_admin') {
          handleNavigate('dashboard');
          return null;
        }
        return <InventoryManagement currentUser={currentUser} />;

      case 'work-orders':
        // Hanya Teknisi dan Admin Penyedia yang bisa akses Work Order
        if (activeRole === 'teknisi') {
          return <TeknisiWorkOrderList currentUser={currentUser} />;
        } else if (activeRole === 'admin_penyedia' || activeRole === 'super_admin') {
          return <WorkOrderList currentUser={currentUser} />;
        } else {
          // Admin Layanan dan role lain tidak bisa akses Work Order
          handleNavigate('dashboard');
          return null;
        }

      case 'reports':
        // Only Super Admin and Admin Penyedia can access Reports
        if (activeRole !== 'super_admin' && activeRole !== 'admin_penyedia') {
          handleNavigate('dashboard');
          return null;
        }
        return <ReportsView currentUser={currentUser} />;

      case 'profile':
      case 'settings':
        return (
          <ProfileSettings
            currentUser={currentUser}
            onUserUpdate={onUserUpdate}
            onNavigate={handleNavigate}
          />
        );

      default:
        return <Dashboard currentUser={currentUser} onNavigate={handleNavigate} onViewTicket={handleViewTicketDetail} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50" key={refreshKey}>
      {/* Header */}
      <Header
        currentUser={currentUser}
        onLogout={onLogout}
        onNavigate={handleNavigate}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onRoleSwitch={handleRoleSwitch}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentUser={currentUser}
          currentView={currentView}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};