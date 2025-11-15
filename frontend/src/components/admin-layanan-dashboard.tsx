//@ts-nocheck
import React, { useMemo, useState } from 'react';
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
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getTickets, getUsers } from '../lib/storage';
import type { User } from '../types';
import type { ViewType } from './main-layout';

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
  const tickets = getTickets();
  const users = getUsers();

  // Admin Layanan Stats
  const stats = useMemo(() => {
    const pendingReview = tickets.filter(t => t.status === 'menunggu_review');
    const needsAction = tickets.filter(t => 
      t.status === 'menunggu_review' || t.status === 'pending_approval'
    );
    const approvedToday = tickets.filter(t => {
      const today = new Date().toDateString();
      return t.status === 'disetujui' && new Date(t.updatedAt).toDateString() === today;
    });

    return {
      pendingReview: pendingReview.length,
      needsAction: needsAction.length,
      totalApproved: tickets.filter(t => t.status === 'disetujui').length,
      totalRejected: tickets.filter(t => t.status === 'ditolak').length,
      approvedToday: approvedToday.length,
      perbaikan: pendingReview.filter(t => t.type === 'perbaikan').length,
      zoomBooking: pendingReview.filter(t => t.type === 'zoom_meeting').length,
      urgentTickets: needsAction.filter(t => t.urgency === 'sangat_mendesak').length,
    };
  }, [tickets]);

  // Pending tickets breakdown
  const pendingByType = useMemo(() => {
    return [
      { name: 'Perbaikan', value: stats.perbaikan, color: '#f59e0b' },
      { name: 'Zoom Meeting', value: stats.zoomBooking, color: '#8b5cf6' },
    ].filter(item => item.value > 0);
  }, [stats]);

  // Recent pending tickets
  const recentPendingTickets = useMemo(() => {
    return tickets
      .filter(t => t.status === 'menunggu_review' || t.status === 'pending_approval')
      .sort((a, b) => {
        // Sort by urgency first, then by date
        const urgencyOrder = { sangat_mendesak: 0, mendesak: 1, normal: 2 };
        const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 8);
  }, [tickets]);

  // Approval stats (last 7 days)
  const approvalTrend = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      const dayTickets = tickets.filter(t => {
        const ticketDate = new Date(t.updatedAt);
        return ticketDate.toDateString() === date.toDateString();
      });

      last7Days.push({
        date: dateStr,
        approved: dayTickets.filter(t => t.status === 'disetujui').length,
        rejected: dayTickets.filter(t => t.status === 'ditolak').length,
      });
    }
    return last7Days;
  }, [tickets]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'perbaikan': return Wrench;
      case 'zoom_meeting': return Video;
      default: return Wrench;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const config = {
      sangat_mendesak: { variant: 'destructive' as const, label: 'Sangat Mendesak' },
      mendesak: { variant: 'default' as const, label: 'Mendesak' },
      normal: { variant: 'outline' as const, label: 'Normal' },
    };
    const urgencyConfig = config[urgency as keyof typeof config] || config.normal;
    return <Badge variant={urgencyConfig.variant}>{urgencyConfig.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-blue-600" />
          Admin Layanan Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Review dan kelola approval tiket dari pengguna
        </p>
      </div>

      {/* Alert for Urgent Tickets */}
      {stats.urgentTickets > 0 && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">
                    {stats.urgentTickets} Tiket Sangat Mendesak!
                  </h3>
                  <p className="text-sm text-red-700">
                    Ada tiket dengan prioritas sangat mendesak yang perlu segera ditinjau
                  </p>
                </div>
                <Button variant="destructive" onClick={() => onNavigate('tickets')}>
                  Review Sekarang
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pending Review</p>
                  <p className="text-4xl text-yellow-600">{stats.pendingReview}</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Memerlukan action
                  </p>
                </div>
                <div className="h-14 w-14 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-7 w-7 text-yellow-600" />
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
                  <p className="text-sm text-gray-500 mb-1">Approved Today</p>
                  <p className="text-4xl text-green-600">{stats.approvedToday}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Total: {stats.totalApproved}
                  </p>
                </div>
                <div className="h-14 w-14 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-green-600" />
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
                  <p className="text-sm text-gray-500 mb-1">Total Rejected</p>
                  <p className="text-4xl text-red-600">{stats.totalRejected}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Lifetime
                  </p>
                </div>
                <div className="h-14 w-14 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-7 w-7 text-red-600" />
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
                  <p className="text-sm text-gray-500 mb-1">Needs Action</p>
                  <p className="text-4xl text-blue-600">{stats.needsAction}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {stats.urgentTickets} urgent
                  </p>
                </div>
                <div className="h-14 w-14 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pending Tickets Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Antrian Tiket Pending</CardTitle>
              <CardDescription>Urutan berdasarkan prioritas dan waktu</CardDescription>
            </div>
            <Button variant="outline" onClick={() => onNavigate('tickets')}>
              Lihat Semua <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentPendingTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <p className="text-lg">Semua tiket sudah direview!</p>
              <p className="text-sm mt-1">Tidak ada tiket yang menunggu approval</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPendingTickets.map((ticket, index) => {
                const TypeIcon = getTypeIcon(ticket.type);
                const requester = users.find(u => u.id === ticket.userId);
                
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onViewTicket(ticket.id)}
                  >
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TypeIcon className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{ticket.title}</h4>
                        {getUrgencyBadge(ticket.urgency)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-mono">{ticket.ticketNumber}</span>
                        <span>•</span>
                        <span>{requester?.name}</span>
                        <span>•</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>

                    <Button size="sm">
                      Review
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};