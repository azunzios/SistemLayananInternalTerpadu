import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Search,
  Eye,
  Filter,
  Package,
  Wrench,
  Video,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getTickets, getUsers } from '../lib/storage';
import type { User, Ticket, TicketStatus, TicketType } from '../types';

interface TicketListProps {
  currentUser: User;
  viewMode: 'all' | 'my-tickets';
  onViewTicket: (ticketId: string) => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  currentUser,
  viewMode,
  onViewTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');

  const tickets = getTickets();
  const users = getUsers();

  // Filter tickets based on user role and view mode
  const filteredTickets = useMemo(() => {
    let result = tickets;

    // Filter by view mode
    if (viewMode === 'my-tickets') {
      result = result.filter(t => {
        if (currentUser.role === 'user') return t.userId === currentUser.id;
        if (currentUser.role === 'teknisi') return t.assignedTo === currentUser.id;
        if (currentUser.role === 'admin_layanan') return true; // See all
        if (currentUser.role === 'super_admin') return true; // See all
        return t.userId === currentUser.id;
      });
      
      console.log('📋 Ticket List (My Tickets mode):', {
        role: currentUser.role,
        userId: currentUser.id,
        totalTickets: tickets.length,
        filteredCount: result.length,
      });
    } else {
      // For admin roles, show tickets they can manage
      if (currentUser.role === 'admin_layanan') {
        // Admin layanan can see both perbaikan and zoom_meeting tickets
        result = result.filter(t => t.type === 'perbaikan' || t.type === 'zoom_meeting');
      } else if (currentUser.role === 'admin_penyedia') {
        // Admin penyedia ONLY manages perbaikan tickets (inventory/spareparts related)
        // NO zoom meeting management
        result = result.filter(t => t.type === 'perbaikan');
      } else if (currentUser.role === 'teknisi') {
        // Teknisi sees perbaikan tickets
        result = result.filter(t => t.type === 'perbaikan');
      }
      
      console.log('📋 Ticket List (All Tickets mode):', {
        role: currentUser.role,
        totalTickets: tickets.length,
        filteredCount: result.length,
      });
    }

    // Apply filters
    if (searchTerm) {
      result = result.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    if (filterUrgency !== 'all') {
      result = result.filter(t => t.urgency === filterUrgency);
    }

    // Sort by newest first
    return result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [tickets, currentUser, viewMode, searchTerm, filterType, filterStatus, filterUrgency]);

  // Group tickets by status for tabs
  const ticketGroups = useMemo(() => {
    return {
      all: filteredTickets,
      pending: filteredTickets.filter(t => 
        ['submitted', 'menunggu_review', 'pending_approval', 'menunggu_verifikasi_penyedia'].includes(t.status)
      ),
      inProgress: filteredTickets.filter(t =>
        ['assigned', 'in_progress', 'on_hold', 'resolved', 'waiting_for_user', 'diproses_persiapan_pengiriman', 'dalam_perbaikan', 'sedang_diagnosa', 'ditugaskan', 'diterima_teknisi', 'dalam_pengiriman'].includes(t.status)
      ),
      completed: filteredTickets.filter(t => ['closed', 'selesai', 'approved'].includes(t.status)),
      rejected: filteredTickets.filter(t =>
        ['closed_unrepairable', 'ditolak', 'tidak_dapat_diperbaiki', 'dibatalkan', 'rejected'].includes(t.status)
      ),
    };
  }, [filteredTickets]);

  const getTypeIcon = (type: TicketType) => {
    switch (type) {
      case 'perbaikan':
        return Wrench;
      case 'zoom_meeting':
        return Video;
      default:
        return Wrench;
    }
  };

  const getTypeLabel = (type: TicketType) => {
    const labels = {
      perbaikan: 'Perbaikan',
      zoom_meeting: 'Zoom Meeting',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: TicketStatus) => {
    const config: Record<string, { variant: any; label: string; icon: any }> = {
      // Status baru untuk perbaikan
      submitted: { variant: 'secondary', label: 'Submitted', icon: Clock },
      assigned: { variant: 'default', label: 'Assigned', icon: Activity },
      in_progress: { variant: 'default', label: 'In Progress', icon: Activity },
      on_hold: { variant: 'secondary', label: 'On Hold', icon: Clock },
      resolved: { variant: 'default', label: 'Resolved', icon: CheckCircle },
      waiting_for_user: { variant: 'secondary', label: 'Waiting for User', icon: Clock },
      closed: { variant: 'default', label: 'Closed', icon: CheckCircle },
      closed_unrepairable: { variant: 'destructive', label: 'Unrepairable', icon: XCircle },
      
      // Status lama (backward compatibility)
      menunggu_review: { variant: 'secondary', label: 'Menunggu Review', icon: Clock },
      pending_approval: { variant: 'secondary', label: 'Pending Approval', icon: Clock },
      disetujui: { variant: 'default', label: 'Disetujui', icon: CheckCircle },
      ditolak: { variant: 'destructive', label: 'Ditolak', icon: XCircle },
      rejected: { variant: 'destructive', label: 'Ditolak', icon: XCircle },
      menunggu_verifikasi_penyedia: { variant: 'secondary', label: 'Verifikasi Penyedia', icon: Clock },
      diproses_persiapan_pengiriman: { variant: 'default', label: 'Persiapan Pengiriman', icon: Activity },
      dalam_pengiriman: { variant: 'default', label: 'Dalam Pengiriman', icon: TrendingUp },
      ditugaskan: { variant: 'default', label: 'Ditugaskan', icon: Activity },
      diterima_teknisi: { variant: 'default', label: 'Diterima Teknisi', icon: Activity },
      sedang_diagnosa: { variant: 'default', label: 'Sedang Diagnosa', icon: Activity },
      dalam_perbaikan: { variant: 'default', label: 'Dalam Perbaikan', icon: Activity },
      menunggu_sparepart: { variant: 'secondary', label: 'Menunggu Sparepart', icon: Clock },
      selesai_diperbaiki: { variant: 'default', label: 'Selesai Diperbaiki', icon: CheckCircle },
      tidak_dapat_diperbaiki: { variant: 'destructive', label: 'Tidak Dapat Diperbaiki', icon: XCircle },
      approved: { variant: 'default', label: 'Disetujui', icon: CheckCircle },
      dibatalkan: { variant: 'secondary', label: 'Dibatalkan', icon: XCircle },
      selesai: { variant: 'default', label: 'Selesai', icon: CheckCircle },
    };

    const statusConfig = config[status] || { variant: 'secondary', label: status, icon: Clock };
    const Icon = statusConfig.icon;

    return (
      <Badge variant={statusConfig.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants = {
      normal: { variant: 'outline' as const, label: 'Normal' },
      mendesak: { variant: 'default' as const, label: 'Mendesak' },
      sangat_mendesak: { variant: 'destructive' as const, label: 'Sangat Mendesak' },
    };
    const config = variants[urgency as keyof typeof variants] || variants.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-left">
          {viewMode === 'my-tickets' ? 'Tiket Saya' : 'Kelola Tiket'}
        </h1>
        <p className="text-gray-500 mt-1">
          {viewMode === 'my-tickets'
            ? 'Pantau status tiket yang Anda ajukan'
            : 'Review dan kelola tiket perbaikan dan zoom dari pengguna'}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
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
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="waiting_for_user">Waiting for User</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="closed_unrepairable">Unrepairable</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Urgensi</Label>
              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Urgensi</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="mendesak">Mendesak</SelectItem>
                  <SelectItem value="sangat_mendesak">Sangat Mendesak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table with Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Semua ({ticketGroups.all.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({ticketGroups.pending.length})
          </TabsTrigger>
          <TabsTrigger value="inProgress" className="gap-2">
            <Activity className="h-4 w-4" />
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

        {(['all', 'pending', 'inProgress', 'completed', 'rejected'] as const).map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor Tiket</TableHead>
                      <TableHead>Judul</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Urgensi</TableHead>
                      {viewMode === 'all' && <TableHead>Pemohon</TableHead>}
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticketGroups[tab].length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={viewMode === 'all' ? 8 : 7}
                          className="text-center py-12 text-gray-500"
                        >
                          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>Tidak ada tiket di kategori ini</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      ticketGroups[tab].map((ticket, index) => {
                        const TypeIcon = getTypeIcon(ticket.type);
                        return (
                          <motion.tr
                            key={ticket.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group hover:bg-gray-50"
                          >
                            <TableCell className="font-mono text-sm">
                              {ticket.ticketNumber}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="font-medium truncate">{ticket.title}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {ticket.description}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <TypeIcon className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{getTypeLabel(ticket.type)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                            <TableCell>{getUrgencyBadge(ticket.urgency)}</TableCell>
                            {viewMode === 'all' && (
                              <TableCell>
                                <div className="text-sm">
                                  <p className="font-medium">{getUserName(ticket.userId)}</p>
                                  {ticket.assignedTo && (
                                    <p className="text-xs text-gray-500">
                                      → {getUserName(ticket.assignedTo)}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="text-sm">
                              {new Date(ticket.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewTicket(ticket.id)}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Detail
                              </Button>
                            </TableCell>
                          </motion.tr>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};