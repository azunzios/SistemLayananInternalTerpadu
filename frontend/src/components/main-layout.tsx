import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Dashboard } from './dashboard';
import { CreateTicket, TicketList, TicketDetail, MyTicketsView } from '@/components/views/tickets';
import { ZoomBooking, ZoomManagementView } from '@/components/views/zoom';
import { UserManagement, ReportsView } from '@/components/views/admin';
import { ProfileSettings} from '@/components/views/shared';
import { WorkOrderList, TeknisiWorkOrderList } from '@/components/views/work-orders';
import { getActiveRole, refreshTicketsFromApi, loadDataFromApiOnce } from '@/lib/storage';
import type { User } from '@/types';

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
  | 'work-orders'
  | 'reports'
  | 'profile'
  | 'settings';

/**
 * Menentukan default view berdasarkan role pengguna
 */
export const getDefaultViewForRole = (role: string): ViewType => {
  switch (role) {
    case 'super_admin':
      return 'dashboard'; // Super admin lihat dashboard dengan overview semua
    
    case 'admin_layanan':
      return 'tickets'; // Admin layanan langsung ke daftar tiket untuk review
    
    case 'admin_penyedia':
      return 'work-orders'; // Admin penyedia langsung ke work orders
    
    case 'teknisi':
      return 'tickets'; // Teknisi lihat tiket yang assigned ke dia
    
    case 'pegawai':
    default:
      return 'my-tickets'; // Pegawai lihat tiket miliknya
  }
};

export const MainLayout: React.FC<MainLayoutProps> = ({ currentUser, onLogout, onUserUpdate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  
  // Derive current view from URL pathname
  const getViewFromPath = (): ViewType => {
    const path = location.pathname.replace('/', '');
    if (path.startsWith('ticket-detail')) return 'ticket-detail';
    return (path || 'dashboard') as ViewType;
  };
  
  const currentView = getViewFromPath();
  const selectedTicketId = params.id || null;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Centralized refresh: on refreshKey change, update tickets cache once
  React.useEffect(() => {
    if (refreshKey > 0) {
      (async () => {
        try {
          await refreshTicketsFromApi();
        } catch (e) {
          console.warn('⚠️ Failed to refresh tickets in MainLayout:', e);
        }
      })();
    }
  }, [refreshKey]);

  React.useEffect(() => {
    const roleToLoad = getActiveRole(currentUser.id) || currentUser.role;
    loadDataFromApiOnce(roleToLoad).catch(err => {
      console.warn('⚠️ Failed to preload datasets for active role', err);
    });
  }, [currentUser.id, currentUser.role]);

  const handleNavigate = (view: ViewType, ticketId?: string) => {
    if (view === 'ticket-detail' && ticketId) {
      navigate(`/ticket-detail/${ticketId}`);
    } else {
      const routeMap: Record<ViewType, string> = {
        'dashboard': '/dashboard',
        'create-ticket-perbaikan': '/create-ticket-perbaikan',
        'create-ticket-zoom': '/create-ticket-zoom',
        'tickets': '/tickets',
        'my-tickets': '/my-tickets',
        'ticket-detail': '/tickets',
        'zoom-booking': '/zoom-booking',
        'zoom-management': '/zoom-management',
        'work-orders': '/work-orders',
        'users': '/users',
        'reports': '/reports',
        'profile': '/profile',
        'settings': '/settings',
      };
      navigate(routeMap[view]);
    }
  };

  const handleRoleSwitch = () => {
    const activeRole = (getActiveRole(currentUser.id) || currentUser.role) as any;
    loadDataFromApiOnce(activeRole).catch(err => {
      console.warn('⚠️ Failed to load datasets for active role', err);
    });
    setRefreshKey(prev => prev + 1);
    navigate(getDefaultViewForRole(activeRole) === 'ticket-detail' ? '/dashboard' : `/${getDefaultViewForRole(activeRole)}`);
  };

  const handleViewTicketDetail = (ticketId: string) => {
    navigate(`/ticket-detail/${ticketId}`);
  };

  const handleBackToList = () => {
    const backRoute = currentUser.role === 'pegawai' ? '/my-tickets' : '/tickets';
    navigate(backRoute);
  };

  const handleCreateTicket = (ticketType: 'perbaikan' | 'zoom_meeting') => {
    const view = ticketType === 'perbaikan' ? '/create-ticket-perbaikan' : '/create-ticket-zoom';
    navigate(view);
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
            onTicketCreated={() => {
              setRefreshKey(prev => prev + 1);
              handleNavigate('my-tickets');
            }}
            onCancel={() => handleNavigate('dashboard')}
          />
        );

      case 'create-ticket-zoom':
        return (
          <CreateTicket
            currentUser={currentUser}
            ticketType="zoom_meeting"
            onTicketCreated={() => {
              setRefreshKey(prev => prev + 1);
              handleNavigate('my-tickets');
            }}
            onCancel={() => handleNavigate('dashboard')}
          />
        );

      case 'tickets':
        return (
          <TicketList
            currentUser={currentUser}
            activeRole={activeRole as any}
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
            onViewTicket={handleViewTicketDetail}
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
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-scroll [scrollbar-gutter:stable]">
          <div className="container mx-auto p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};
