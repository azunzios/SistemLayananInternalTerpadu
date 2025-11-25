import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  TicketIcon,
  Activity,
  Shield,
  Database,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getTickets, getUsersSync, getAuditLogs } from '@/lib/storage';
import type { User } from '@/types';
import type { ViewType } from '@/components/main-layout';

interface SuperAdminDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onNavigate,
}) => {
  const tickets = getTickets();
  const users = getUsersSync();
  const auditLogs = getAuditLogs();

  // System Statistics
  const stats = useMemo(() => {
    const today = new Date();
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      totalTickets: tickets.length,
      pendingTickets: tickets.filter(t =>
        ['menunggu_review', 'pending_approval', 'menunggu_verifikasi_penyedia'].includes(t.status)
      ).length,
      completedTickets: tickets.filter(t => t.status === 'selesai').length,
      rejectedTickets: tickets.filter(t => ['ditolak', 'rejected'].includes(t.status)).length,
      ticketsLast7Days: tickets.filter(t => new Date(t.createdAt) >= last7Days).length,
      ticketsLast30Days: tickets.filter(t => new Date(t.createdAt) >= last30Days).length,
      avgResolutionTime: calculateAvgResolutionTime(tickets),
    };
  }, [tickets, users]);

  function calculateAvgResolutionTime(tickets: any[]) {
    const completed = tickets.filter(t => t.status === 'selesai');
    if (completed.length === 0) return 0;

    const totalHours = completed.reduce((acc, t) => {
      const created = new Date(t.createdAt);
      const updated = new Date(t.updatedAt);
      const hours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
      return acc + hours;
    }, 0);

    return Math.round(totalHours / completed.length);
  }

  // Tickets by Type
  const ticketsByType = useMemo(() => {
    return [
      {
        name: 'Perbaikan',
        value: tickets.filter(t => t.type === 'perbaikan').length,
      },
      {
        name: 'Zoom Meeting',
        value: tickets.filter(t => t.type === 'zoom_meeting').length,
      },
    ];
  }, [tickets]);

  // Tickets by Status
  const ticketsByStatus = useMemo(() => {
    return [
      { name: 'Pending', value: stats.pendingTickets },
      { name: 'In Progress', value: tickets.filter(t => 
        ['ditugaskan', 'dalam_perbaikan', 'diproses_persiapan_pengiriman'].includes(t.status)
      ).length },
      { name: 'Completed', value: stats.completedTickets },
      { name: 'Rejected', value: stats.rejectedTickets },
    ];
  }, [tickets, stats]);

  // Users by Role
  const usersByRole = useMemo(() => {
    return [
      { name: 'Super Admin', value: users.filter(u => u.role === 'super_admin').length },
      { name: 'Admin Layanan', value: users.filter(u => u.role === 'admin_layanan').length },
      { name: 'Admin Penyedia', value: users.filter(u => u.role === 'admin_penyedia').length },
      { name: 'Teknisi', value: users.filter(u => u.role === 'teknisi').length },
      { name: 'Pegawai', value: users.filter(u => u.role === 'pegawai').length },
    ];
  }, [users]);

  // Tickets Trend (Last 7 days)
  const ticketsTrend = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      const dayTickets = tickets.filter(t => {
        const ticketDate = new Date(t.createdAt);
        return ticketDate.toDateString() === date.toDateString();
      });

      last7Days.push({
        date: dateStr,
        tickets: dayTickets.length,
        completed: dayTickets.filter(t => t.status === 'selesai').length,
      });
    }
    return last7Days;
  }, [tickets]);

  // Recent Activities
  const recentActivities = useMemo(() => {
    return auditLogs.slice(0, 10).map(log => {
      const user = users.find(u => u.id === log.userId);
      return {
        ...log,
        userName: user?.name || 'Unknown User',
      };
    });
  }, [auditLogs, users]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-600" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Overview sistem dan monitoring lengkap
          </p>
        </div>
        <Badge variant="destructive" className="gap-2">
          <Shield className="h-4 w-4" />
          Full Access
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Users</p>
                  <p className="text-3xl">{stats.totalUsers}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {stats.activeUsers} active
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Tickets</p>
                  <p className="text-3xl">{stats.totalTickets}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    +{stats.ticketsLast7Days} this week
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TicketIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pending Review</p>
                  <p className="text-3xl">{stats.pendingTickets}</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Needs attention
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Avg Resolution</p>
                  <p className="text-3xl">{stats.avgResolutionTime}h</p>
                  <p className="text-xs text-green-600 mt-1">
                    {stats.completedTickets} completed
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tickets Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Trend (7 Hari Terakhir)</CardTitle>
            <CardDescription>Perbandingan tiket baru vs selesai</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ticketsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tickets" stroke="#3b82f6" name="Tiket Baru" strokeWidth={2} />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Selesai" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tickets by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Jenis Tiket</CardTitle>
            <CardDescription>Total {stats.totalTickets} tiket</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ticketsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ticketsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi User per Role</CardTitle>
            <CardDescription>Total {stats.totalUsers} users</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usersByRole}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tickets by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status Tiket</CardTitle>
            <CardDescription>Overview status saat ini</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ticketsByStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-2" onClick={() => onNavigate('user-management')}>
              <Users className="h-4 w-4" />
              Manage Users
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" onClick={() => onNavigate('tickets')}>
              <TicketIcon className="h-4 w-4" />
              View All Tickets
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" onClick={() => onNavigate('reports')}>
              <BarChart3 className="h-4 w-4" />
              System Reports
            </Button>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.pendingTickets > 10 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900">High Pending Tickets</p>
                  <p className="text-xs text-orange-700">
                    {stats.pendingTickets} tiket menunggu review
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => onNavigate('tickets')}>
                  Review
                </Button>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Activity className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">System Status</p>
                <p className="text-xs text-green-700">
                  All systems operational • {stats.activeUsers} active users
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activities</CardTitle>
          <CardDescription>10 aktivitas terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Database className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.userName}</p>
                  <p className="text-xs text-gray-500">{activity.action} - {activity.details}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(activity.timestamp).toLocaleTimeString('id-ID')}
                </p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
