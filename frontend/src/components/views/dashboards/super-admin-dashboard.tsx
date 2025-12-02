import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
Shield,
Users,
Package
} from 'lucide-react';
import { motion } from 'motion/react';
import {
BarChart,
Bar,
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
import { getTickets, getUsersSync } from '@/lib/storage';
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
    completedTickets: tickets.filter(t => t.status === 'closed').length,
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

return (
  <div className="space-y-6">
    {/* Welcome Section - styled like admin layanan dashboard */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="    
      bg-red-500 
      rounded-3xl 
      p-8 
      text-white
      border border-white/30
      shadow-[inset_0_0_20px_rgba(255,255,255,0.5),0_10px_20px_rgba(0,0,0,0.2)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 flex items-center gap-3">
            Super Admin Dashboard
          </h1>
          <p className="text-red-100">
            Overview sistem dan monitoring lengkap
          </p>
        </div>
        <div className="hidden md:block">
          <Shield className="h-20 w-20 text-red-100 opacity-50" />
        </div>
      </div>

{/* Shortcuts Grid */}
        <div className="flex items-center justify-center gap-6 px-8 md:px-40 mt-10">
          <motion.button
            whileTap={{ scale: 0.98 }} // Efek klik sedikit saja (bukan hover)
            onClick={() => onNavigate('users')}
            className="
              relative group flex-1 py-4 px-8 rounded-full transition-all duration-300
              
              /* Base Color */
              bg-gradient-to-b from-green-600 to-green-700
              
              /* Soap/Glassy Effect (Inner Shadows & Highlights) */
              shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]
              border-t border-white/40 border-b border-green-700/20
              
              /* Hover Action: Brightness & Slight Shadow Lift (No Scale) */
              hover:brightness-105 hover:shadow-[inset_0_2px_6px_rgba(255,255,255,0.6),0_6px_12px_rgba(0,0,0,0.15)]
            "
          >
            {/* Shine Reflection Overlay (Efek kilau kaca di bagian atas) */}
            <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none" />

            <div className="relative flex items-center justify-between gap-4 z-10">
              <div className="text-left pl-2">
                <p className="text-green-100 text-xs font-medium uppercase tracking-wider drop-shadow-sm">User Management</p>
                <p className="text-white font-bold text-lg mt-0.5 drop-shadow-md">{stats.totalUsers} Users</p>
              </div>
              <div className="h-10 w-10 bg-green-900 rounded-full flex items-center justify-center shadow-inner border border-white/10">
                 <Users className="h-5 w-5 text-white drop-shadow-sm" />
              </div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('bmn-assets')}
            className="
              relative group flex-1 py-4 px-8 rounded-full transition-all duration-300
              
              /* Base Color */
              bg-gradient-to-b from-green-600 to-green-700
              
              /* Soap/Glassy Effect */
              shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]
              border-t border-white/40 border-b border-green-700/20
              
              /* Hover Action */
              hover:brightness-105 hover:shadow-[inset_0_2px_6px_rgba(255,255,255,0.6),0_6px_12px_rgba(0,0,0,0.15)]
            "
          >
             {/* Shine Reflection Overlay */}
             <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none" />

            <div className="relative flex items-center justify-between gap-4 z-10">
              <div className="text-left pl-2">
                <p className="text-green-100 text-xs font-medium uppercase tracking-wider drop-shadow-sm">Asset Management</p>
                <p className="text-white font-bold text-lg mt-0.5 drop-shadow-md">Kelola Aset</p>
              </div>
              <div className="h-10 w-10 bg-green-900 rounded-full flex items-center justify-center shadow-inner border border-white/10">
                <Package className="h-5 w-5 text-white drop-shadow-sm" />
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>

    {/* Remaining Charts Section */}
    <div className="grid gap-6 grid-cols-3">
      {/* Users by Role - Full width */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Distribusi Role</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={usersByRole}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tickets by Type - Square/Small */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Distribusi Jenis Tiket</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ticketsByType}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                  style={{ fontSize: '10px' }}
                >
                  {ticketsByType.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);
};