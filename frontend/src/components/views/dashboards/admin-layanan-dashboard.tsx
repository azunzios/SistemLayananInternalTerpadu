//@ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  Package,
  Wrench,
  Video,
  Users,
  ArrowUpRight,
  Sparkles,
  Loader,
} from 'lucide-react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import { getTickets } from '@/lib/storage';
import type { User } from '@/types';
import type { ViewType } from '@/components/main-layout';
import { Spinner } from '@/components/ui/spinner';

interface DashboardStats {
  statistics: {
    total: number;
    perbaikan: { count: number; status: string };
    zoom: { count: number; status: string };
    closed: { count: number; percentage: number; description: string };
  };
  trend: Array<{ date: string; perbaikan: number; zoom: number }>;
}

interface AdminLayananDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
  onViewTicket: (ticketId: string) => void;
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

export const AdminLayananDashboard: React.FC<AdminLayananDashboardProps> = ({
  currentUser,
  onNavigate,
  onViewTicket,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const tickets = getTickets();

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await api.get<DashboardStats>('/tickets/stats/admin-layanan-dashboard');
        setStats(response);
      } catch (err) {
        console.error('Failed to load admin layanan dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Memoize trend data dari API
  const last7DaysTrend = useMemo(() => {
    if (!stats || !stats.trend) return [];
    return stats.trend;
  }, [stats]);

  // Get recent pending tickets dari local data untuk display di queue
  const recentPendingTickets = useMemo(() => {
    return tickets
      .filter(t => t.status === 'pending_review' || t.status === 'submitted')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [tickets]);

  // NOW we can do early returns after all hooks
  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            Admin Layanan Dashboard
          </h1>
          <div className="flex flex-row gap-4">
            <p className="text-gray-500 mt-1">Memuat data dashboard...</p>
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'perbaikan': return Wrench;
      case 'zoom_meeting': return Video;
      default: return Wrench;
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Welcome Section - styled like user dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="    
          bg-blue-500 
          rounded-3xl 
          p-8 
          text-white
          border border-white/30
          shadow-[inset_0_0_20px_rgba(255,255,255,0.5),0_10px_20px_rgba(0,0,0,0.2)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-2">
                Admin Layanan Dashboard
              </h1>
              <p className="text-blue-100">
                Pantau dan kelola semua tiket dari seluruh pengguna
              </p>
            </div>
            <div className="hidden md:block">
              <Sparkles className="h-20 w-20 text-blue-100 opacity-50" />
            </div>
          </div>

          <Separator className="my-6 bg-blue-300" />

          {/* Statistics Grid - matching user dashboard style */}
          <div className="flex items-center justify-between">
            {loading ? (
              <div className="w-full flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-blue-100" />
              </div>
            ) : stats && stats.statistics ? (
              <>
                <div className="flex-1 px-4 py-4 text-center border-r border-blue-300">
                  <p className="text-blue-100 text-sm">Total Tiket</p>
                  <p className="text-3xl mt-1 font-bold">{stats.statistics.total}</p>
                  <p className="text-xs text-blue-100 mt-1">semua status</p>
                </div>
                <div className="flex-1 px-4 py-4 text-center border-r border-blue-300">
                  <p className="text-blue-100 text-sm">Tiket Perbaikan</p>
                  <p className="text-3xl mt-1 font-bold">{stats.statistics.perbaikan.count}</p>
                  <p className="text-xs text-blue-100 mt-1">{stats.statistics.perbaikan.status}</p>
                </div>
                <div className="flex-1 px-4 py-4 text-center border-r border-blue-300">
                  <p className="text-blue-100 text-sm">Tiket Zoom</p>
                  <p className="text-3xl mt-1 font-bold">{stats.statistics.zoom.count}</p>
                  <p className="text-xs text-blue-100 mt-1">{stats.statistics.zoom.status}</p>
                </div>
                <div className="flex-1 px-4 py-4 text-center">
                  <p className="text-blue-100 text-sm">Closed</p>
                  <p className="text-3xl mt-1 font-bold">{stats.statistics.closed.count}</p>
                  <p className="text-xs text-blue-100 mt-1">{stats.statistics.closed.description}</p>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>

        {/* Chart - Last 7 days trend for both types */}
        <Card>
          <CardHeader>
            <CardTitle>Tiket Masuk (7 Hari Terakhir)</CardTitle>
            <CardDescription>Jumlah tiket baru per hari berdasarkan tipe</CardDescription>
          </CardHeader>
          <CardContent>
            {last7DaysTrend && last7DaysTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={last7DaysTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    domain={[0, Math.ceil(Math.max(...last7DaysTrend.map(d => Math.max(d.perbaikan, d.zoom))) / 1) || 1]}
                    ticks={Array.from({ length: Math.ceil(Math.max(...last7DaysTrend.map(d => Math.max(d.perbaikan, d.zoom))) / 1) || 2 }, (_, i) => i)}
                    type="number"
                  />
                  <Tooltip formatter={(value) => [`${value} tiket`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="perbaikan" stroke="#f59e0b" strokeWidth={2} name="Perbaikan" dot={{ fill: '#f59e0b' }} />
                  <Line type="monotone" dataKey="zoom" stroke="#8b5cf6" strokeWidth={2} name="Zoom" dot={{ fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-[300px] flex items-center justify-center text-gray-500">
                Loading chart data...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tickets Queue */}
        <Card className="pb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tiket Terbaru Pending</CardTitle>
                <CardDescription>
                  {stats && stats.statistics ? stats.statistics.perbaikan.count + stats.statistics.zoom.count : 0} tiket menunggu action
                </CardDescription>
              </div>
              <Button
                onClick={() => onNavigate('tickets')}
                className="
    /* Bentuk & Layout */
    relative overflow-hidden rounded-full group px-6
    
    /* Warna Dasar */
    bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 
    text-white font-medium
    
    /* Efek Sabun (Soap Effect) */
    /* 1. Inset putih keliling (tebal 2px) */
    /* 2. Highlight atas lembut */
    /* 3. Shadow bawah lembut */
    /* 4. Glow luar tipis */
    shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,0.6),inset_0px_4px_8px_rgba(255,255,255,0.2),inset_0px_-4px_8px_rgba(0,0,0,0.1),0px_2px_5px_rgba(59,130,246,0.2)]
    
    /* Interaksi */
    hover:brightness-110 transition-all duration-300
  "
              >
                <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
                  Lihat Semua
                  {/* Animasi panah gerak diagonal saat hover */}
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <p className="text-lg">Semua tiket sudah diproses!</p>
                <p className="text-sm mt-1">Tidak ada tiket yang menunggu</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentPendingTickets.slice(0, 3).map((ticket, index) => {
                  const TypeIcon = getTypeIcon(ticket.type);

                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200"
                    >
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <TypeIcon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{ticket.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span className="font-mono">{ticket.ticketNumber}</span>
                          <span>•</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {recentPendingTickets.length > 3 && (
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <button
                      onClick={() => onNavigate('tickets')}
                      className="text-sm text-blue-100 hover:text-blue-700 font-medium transition-colors hover:underline"
                    >
                      + {recentPendingTickets.length - 3} tiket lainnya
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};