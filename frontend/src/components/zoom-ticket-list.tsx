import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Filter,
  Search,
  Calendar,
  Clock,
  User,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  Link as LinkIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Ticket } from '../types';

interface ZoomTicketListProps {
  tickets: Ticket[];
  onViewDetail?: (ticketId: string) => void;
}

export const ZoomTicketList: React.FC<ZoomTicketListProps> = ({ tickets, onViewDetail }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Filter zoom tickets only
  const zoomTickets = useMemo(() => {
    return tickets.filter(ticket => ticket.type === 'zoom_meeting');
  }, [tickets]);

  // Apply filters
  const filteredTickets = useMemo(() => {
    let filtered = [...zoomTickets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.ticketNumber.toLowerCase().includes(query) ||
        ticket.title.toLowerCase().includes(query) ||
        ticket.userName.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      if (dateFilter === 'today') {
        filtered = filtered.filter(ticket => ticket.data?.meetingDate === todayStr);
      } else if (dateFilter === 'upcoming') {
        filtered = filtered.filter(ticket => {
          const meetingDate = ticket.data?.meetingDate;
          return meetingDate && meetingDate >= todayStr;
        });
      } else if (dateFilter === 'past') {
        filtered = filtered.filter(ticket => {
          const meetingDate = ticket.data?.meetingDate;
          return meetingDate && meetingDate < todayStr;
        });
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.data?.meetingDate || a.createdAt).getTime();
      const dateB = new Date(b.data?.meetingDate || b.createdAt).getTime();
      return dateB - dateA;
    });

    return filtered;
  }, [zoomTickets, searchQuery, statusFilter, dateFilter]);

  // Count by status
  const statusCounts = useMemo(() => {
    return {
      all: zoomTickets.length,
      pending_review: zoomTickets.filter(t => t.status === 'pending_review').length,
      approved: zoomTickets.filter(t => t.status === 'approved').length,
      rejected: zoomTickets.filter(t => t.status === 'rejected').length,
      completed: zoomTickets.filter(t => t.status === 'completed').length,
    };
  }, [zoomTickets]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending_review: { label: 'Menunggu Review', variant: 'secondary' },
      approved: { label: 'Disetujui', variant: 'default' },
      rejected: { label: 'Ditolak', variant: 'destructive' },
      completed: { label: 'Selesai', variant: 'outline' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return (
      <Badge variant={statusInfo.variant} className="whitespace-nowrap">
        {statusInfo.label}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Handle view detail
  const handleViewDetail = (ticketId: string) => {
    if (onViewDetail) {
      onViewDetail(ticketId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl flex items-center gap-3">
          <Video className="h-7 w-7 text-blue-600" />
          Daftar Tiket Booking Zoom
        </h2>
        <p className="text-gray-500 mt-1">
          Review dan kelola semua tiket booking Zoom meeting dari pengguna
        </p>
      </div>

      {/* Filter & Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm">Cari Tiket</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nomor tiket atau judul..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending_review">Menunggu Review</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm">Tanggal Meeting</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tanggal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tanggal</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="upcoming">Akan Datang</SelectItem>
                  <SelectItem value="past">Sudah Lewat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
          className="gap-2"
        >
          Semua ({statusCounts.all})
        </Button>
        <Button
          variant={statusFilter === 'pending_review' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('pending_review')}
          className="gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Pending ({statusCounts.pending_review})
        </Button>
        <Button
          variant={statusFilter === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('approved')}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Disetujui ({statusCounts.approved})
        </Button>
        <Button
          variant={statusFilter === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('rejected')}
          className="gap-2"
        >
          <XCircle className="h-4 w-4" />
          Ditolak ({statusCounts.rejected})
        </Button>
        <Button
          variant={statusFilter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('completed')}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Selesai ({statusCounts.completed})
        </Button>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Video className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Tidak ada tiket ditemukan</p>
              <p className="text-sm mt-1">Coba ubah filter pencarian Anda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Tiket</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Tanggal Meeting</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Akun Zoom</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pemohon</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket, index) => (
                    <motion.tr
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group hover:bg-gray-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-blue-600" />
                          <span className="font-mono">{ticket.ticketNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {ticket.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(ticket.data?.meetingDate || ticket.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            {ticket.data?.startTime} - {ticket.data?.endTime}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ticket.data?.zoomAccount ? (
                          <Badge variant="outline" className="gap-1.5">
                            <LinkIcon className="h-3 w-3" />
                            {ticket.data.zoomAccount}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">Belum ditentukan</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ticket.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-sm">{ticket.userName}</p>
                            <p className="text-xs text-gray-500">{ticket.userNIP}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(ticket.id)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Detail
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {filteredTickets.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Menampilkan {filteredTickets.length} dari {zoomTickets.length} total tiket booking Zoom
        </div>
      )}
    </div>
  );
};
