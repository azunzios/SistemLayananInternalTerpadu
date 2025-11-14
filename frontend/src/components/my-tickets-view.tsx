import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Package,
  Wrench,
  Video,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  Eye,
  MapPin,
  Calendar,
  Activity,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getTickets } from '../lib/storage';
import type { User, Ticket } from '../types';

interface MyTicketsViewProps {
  currentUser: User;
  onViewTicket: (ticketId: string) => void;
}

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({ currentUser, onViewTicket }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const tickets = getTickets();
  
  // Filter tickets based on user role
  const myTickets = useMemo(() => {
    let filtered: Ticket[] = [];
    
    if (currentUser.role === 'teknisi') {
      // Teknisi sees tickets assigned to them
      filtered = tickets.filter(t => t.assignedTo === currentUser.id);
      console.log('📋 My Tickets View - Teknisi:', {
        userId: currentUser.id,
        totalTickets: tickets.length,
        assignedToMe: filtered.length,
        myTickets: filtered.map(t => ({ number: t.ticketNumber, status: t.status }))
      });
    } else if (currentUser.role === 'admin_layanan') {
      // Admin Layanan sees all tickets
      filtered = tickets;
    } else if (currentUser.role === 'admin_penyedia') {
      // Admin Penyedia no longer manages tickets
      filtered = [];
    } else if (currentUser.role === 'super_admin') {
      // Super Admin sees all tickets
      filtered = tickets;
    } else {
      // Regular users see their own tickets
      filtered = tickets.filter(t => t.userId === currentUser.id);
    }
    
    return filtered;
  }, [tickets, currentUser.id, currentUser.role]);

  // Filter and sort tickets
  const filteredTickets = useMemo(() => {
    let result = myTickets;

    // Search filter
    if (searchTerm) {
      result = result.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [myTickets, searchTerm, filterType, sortBy]);

  // Group by status
  const ticketGroups = useMemo(() => {
    return {
      all: filteredTickets,
      pending: filteredTickets.filter(t =>
        ['submitted', 'menunggu_review', 'pending_approval', 'menunggu_verifikasi_penyedia'].includes(t.status)
      ),
      inProgress: filteredTickets.filter(t =>
        ['assigned', 'in_progress', 'on_hold', 'resolved', 'waiting_for_user', 'ditugaskan', 'diterima_teknisi', 'sedang_diagnosa', 'dalam_perbaikan', 'diproses_persiapan_pengiriman', 'dalam_pengiriman'].includes(t.status)
      ),
      completed: filteredTickets.filter(t => ['closed', 'selesai', 'approved'].includes(t.status)),
      rejected: filteredTickets.filter(t => ['closed_unrepairable', 'ditolak', 'rejected', 'dibatalkan'].includes(t.status)),
    };
  }, [filteredTickets]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'perbaikan':
        return Wrench;
      case 'zoom_meeting':
        return Video;
      default:
        return Package;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      perbaikan: 'Perbaikan',
      zoom_meeting: 'Zoom Meeting',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'perbaikan':
        return 'from-orange-500 to-orange-600';
      case 'zoom_meeting':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any; progress: number }> = {
      // Status baru untuk perbaikan
      submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800', icon: Clock, progress: 15 },
      assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-800', icon: TrendingUp, progress: 30 },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Activity, progress: 60 },
      on_hold: { label: 'On Hold', color: 'bg-orange-100 text-orange-800', icon: Clock, progress: 50 },
      resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle, progress: 85 },
      waiting_for_user: { label: 'Waiting for User', color: 'bg-purple-100 text-purple-800', icon: Clock, progress: 90 },
      closed: { label: 'Closed', color: 'bg-green-100 text-green-800', icon: CheckCircle, progress: 100 },
      closed_unrepairable: { label: 'Closed - Unrepairable', color: 'bg-red-100 text-red-800', icon: XCircle, progress: 100 },
      
      // Status lama (backward compatibility)
      menunggu_review: { label: 'Menunggu Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock, progress: 20 },
      pending_approval: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800', icon: Clock, progress: 20 },
      menunggu_verifikasi_penyedia: { label: 'Verifikasi Penyedia', color: 'bg-blue-100 text-blue-800', icon: Clock, progress: 40 },
      disetujui: { label: 'Disetujui', color: 'bg-green-100 text-green-800', icon: CheckCircle, progress: 50 },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle, progress: 67 },
      ditugaskan: { label: 'Ditugaskan ke Teknisi', color: 'bg-blue-100 text-blue-800', icon: TrendingUp, progress: 50 },
      diterima_teknisi: { label: 'Diterima Teknisi', color: 'bg-blue-100 text-blue-800', icon: CheckCircle, progress: 60 },
      sedang_diagnosa: { label: 'Sedang Diagnosa', color: 'bg-blue-100 text-blue-800', icon: TrendingUp, progress: 70 },
      dalam_perbaikan: { label: 'Dalam Perbaikan', color: 'bg-blue-100 text-blue-800', icon: TrendingUp, progress: 80 },
      diproses_persiapan_pengiriman: { label: 'Persiapan Pengiriman', color: 'bg-blue-100 text-blue-800', icon: TrendingUp, progress: 70 },
      dalam_pengiriman: { label: 'Dalam Pengiriman', color: 'bg-blue-100 text-blue-800', icon: TrendingUp, progress: 90 },
      selesai: { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircle, progress: 100 },
      ditolak: { label: 'Ditolak', color: 'bg-red-100 text-red-800', icon: XCircle, progress: 100 },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle, progress: 100 },
      dibatalkan: { label: 'Dibatalkan', color: 'bg-gray-100 text-gray-800', icon: XCircle, progress: 100 },
    };

    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: Clock, progress: 0 };
  };

  const TicketCard: React.FC<{ ticket: Ticket; index: number }> = ({ ticket, index }) => {
    const TypeIcon = getTypeIcon(ticket.type);
    const statusInfo = getStatusInfo(ticket.status);
    const StatusIcon = statusInfo.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => onViewTicket(ticket.id)}>
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <div className={`h-12 w-12 bg-gradient-to-br ${getTypeColor(ticket.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <TypeIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate mb-1">{ticket.title}</h3>
                  <p className="text-xs text-gray-500 font-mono">{ticket.ticketNumber}</p>
                  <Badge variant="outline" className="mt-2">
                    {getTypeLabel(ticket.type)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{statusInfo.label}</span>
                </div>
                <span className="text-xs text-gray-500">{statusInfo.progress}%</span>
              </div>
              <Progress value={statusInfo.progress} className="h-2" />
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Dibuat: {new Date(ticket.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
              {ticket.urgency && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <Badge
                    variant={
                      ticket.urgency === 'sangat_mendesak'
                        ? 'destructive'
                        : ticket.urgency === 'mendesak'
                        ? 'default'
                        : 'outline'
                    }
                    className="text-xs"
                  >
                    {ticket.urgency === 'sangat_mendesak'
                      ? 'Sangat Mendesak'
                      : ticket.urgency === 'mendesak'
                      ? 'Mendesak'
                      : 'Normal'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="mt-4 pt-4 border-t">
              <Button variant="ghost" className="w-full gap-2" onClick={() => onViewTicket(ticket.id)}>
                <Eye className="h-4 w-4" />
                Lihat Detail & Timeline
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl">Tiket Saya</h1>
        <p className="text-gray-500 mt-1">
          Pantau status dan progress semua tiket yang Anda ajukan
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Cari Tiket</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nomor tiket atau judul..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jenis Tiket</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="perbaikan">Perbaikan</SelectItem>
                  <SelectItem value="zoom_meeting">Zoom Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Urutkan</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="oldest">Terlama</SelectItem>
                  <SelectItem value="title">Judul (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            Semua ({ticketGroups.all.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({ticketGroups.pending.length})
          </TabsTrigger>
          <TabsTrigger value="inProgress" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Diproses ({ticketGroups.inProgress.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Selesai ({ticketGroups.completed.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Ditolak ({ticketGroups.rejected.length})
          </TabsTrigger>
        </TabsList>

        {(['all', 'pending', 'inProgress', 'completed', 'rejected'] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            {ticketGroups[tab].length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">Tidak ada tiket di kategori ini</p>
                    <p className="text-sm">
                      {tab === 'all' && 'Buat tiket pertama Anda untuk memulai!'}
                      {tab === 'pending' && 'Semua tiket Anda sudah diproses'}
                      {tab === 'inProgress' && 'Tidak ada tiket yang sedang diproses'}
                      {tab === 'completed' && 'Belum ada tiket yang selesai'}
                      {tab === 'rejected' && 'Tidak ada tiket yang ditolak'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ticketGroups[tab].map((ticket, index) => (
                  <TicketCard key={ticket.id} ticket={ticket} index={index} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Tips Menggunakan Sistem</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Klik pada tiket untuk melihat detail dan timeline lengkap</li>
                <li>Progress bar menunjukkan tahap penyelesaian tiket</li>
                <li>Anda akan menerima notifikasi setiap ada update pada tiket</li>
                <li>Konfirmasi penyelesaian tiket setelah barang/layanan diterima</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
