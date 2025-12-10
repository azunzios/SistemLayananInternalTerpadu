import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalAssets: number;
  totalTickets: number;
  pendingTickets: number;
  completedTickets: number;
  rejectedTickets: number;
  ticketsLast7Days: number;
  ticketsLast30Days: number;
  avgResolutionTime: number;
}

export interface TicketsByType {
  name: string;
  value: number;
}

export interface UsersByRole {
  name: string;
  value: number;
}

interface UseSuperAdminDashboardReturn {
  stats: DashboardStats | null;
  ticketsByType: TicketsByType[];
  usersByRole: UsersByRole[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const defaultStats: DashboardStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalAssets: 0,
  totalTickets: 0,
  pendingTickets: 0,
  completedTickets: 0,
  rejectedTickets: 0,
  ticketsLast7Days: 0,
  ticketsLast30Days: 0,
  avgResolutionTime: 0,
};

export function useSuperAdminDashboard(): UseSuperAdminDashboardReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ticketsByType, setTicketsByType] = useState<TicketsByType[]>([]);
  const [usersByRole, setUsersByRole] = useState<UsersByRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await api.get('/tickets/stats/super-admin-dashboard');

      if (response) {
        // Response from Laravel API returns data directly (not wrapped in .data)
        // Structure: { stats: {...}, ticketsByType: [...], usersByRole: [...] }
        if (response.stats) {
          setStats(response.stats);
          setTicketsByType(response.ticketsByType || []);
          setUsersByRole(response.usersByRole || []);
        } else if (response.data && response.data.stats) {
          // Fallback if wrapped in .data property
          setStats(response.data.stats);
          setTicketsByType(response.data.ticketsByType || []);
          setUsersByRole(response.data.usersByRole || []);
        }
      }
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Gagal mengambil data dashboard');
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    stats: stats || defaultStats,
    ticketsByType,
    usersByRole,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}
