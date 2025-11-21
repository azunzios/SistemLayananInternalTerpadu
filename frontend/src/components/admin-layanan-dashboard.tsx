//@ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
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
} from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../lib/api';
import { getTickets } from '../lib/storage';
import type { User } from '../types';
import type { ViewType } from './main-layout';
import { Spinner } from '@/components/ui/spinner';

interface DashboardStats {
  total: number;
  pending: number;
  pendingReview: number;
  pendingApproval: number;
  in_progress: number;
  approved: number;
  completed: number;
  rejected: number;
  completion_rate: number;
  perbaikan: number;
  zoom: number;
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

  // Define useMemo BEFORE any conditional returns
  const pendingByType = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Perbaikan', value: stats.perbaikan, color: '#f59e0b' },
      { name: 'Zoom Meeting', value: stats.zoom, color: '#8b5cf6' },
    ].filter(item => item.value > 0);
  }, [stats]);

  const recentPendingTickets = useMemo(() => {
    return tickets
      .filter(t => t.status === 'pending_review' || t.status === 'submitted')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [tickets]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await api.get<DashboardStats>('/tickets/stats/admin-dashboard');
        setStats(response);
      } catch (err) {
        console.error('Failed to load admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // NOW we can do early returns after all hooks
  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            Admin Layanan Dashboard
            <ClipboardCheck className="h-8 w-8 text-blue-600" />
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          Admin Layanan Dashboard
          <ClipboardCheck className="h-8 w-8 text-blue-600" />
        </h1>
        <p className="text-gray-500 mt-1">
          Pantau dan kelola semua tiket dari seluruh pengguna
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Tiket</p>
                  <p className="text-4xl font-bold text-blue-600"  style={{fontFamily: "var(--font-logo)"}}>{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">Semua tipe</p>
                </div>
                <div className="h-14 w-14 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="h-7 w-7 text-blue-600" />
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
                  <p className="text-sm text-gray-500 mb-1">Pending</p>
                  <p className="text-4xl font-bold text-yellow-600"  style={{fontFamily: "var(--font-logo)"}}>{stats.pending}</p>
                  <p className="text-xs text-yellow-700 mt-1">Menunggu action</p>
                </div>
                <div className="h-14 w-14 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-7 w-7 text-yellow-600" />
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
                  <p className="text-sm text-gray-500 mb-1">Completed</p>
                  <p className="text-4xl font-bold text-green-600"  style={{fontFamily: "var(--font-logo)"}}>{stats.completed}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.completion_rate}% completion</p>
                </div>
                <div className="h-14 w-14 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-green-600" />
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
                  <p className="text-sm text-gray-500 mb-1">Rejected</p>
                  <p className="text-4xl font-bold text-red-600" style={{fontFamily: "var(--font-logo)"}}>{stats.rejected}</p>
                  <p className="text-xs text-gray-500 mt-1">Tidak disetujui</p>
                </div>
                <div className="h-14 w-14 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-7 w-7 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pending Tickets Queue */}
      <Card className="gap-0 pb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tiket Terbaru Pending</CardTitle>
              <CardDescription>{stats.pending} tiket menunggu action</CardDescription>
            </div>
            <Button variant="link" onClick={() => onNavigate('tickets')} className="p-0">
              Lihat Semua <ArrowUpRight  />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentPendingTickets.length === 0 ? (
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
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TypeIcon className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{ticket.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="font-mono text-blue-600">{ticket.ticketNumber}</span>
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
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors hover:underline"
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
  );
};