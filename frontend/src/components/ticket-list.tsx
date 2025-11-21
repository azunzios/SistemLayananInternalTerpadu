import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Search,
  Eye,
  Wrench,
  Video,
  AlertCircle,
  RotateCcw,
  User as UserIcon,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import type { User, Ticket } from '../types';

interface TicketListProps {
  currentUser: User;
  viewMode: 'all' | 'my-tickets';
  onViewTicket: (ticketId: string) => void;
}

interface TicketStats {
  total: number;
  pending: number;
  in_progress: number;
  approved: number;
  completed: number;
  rejected: number;
}

interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
  has_more: boolean;
}

export const TicketList: React.FC<TicketListProps> = ({ onViewTicket }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<TicketStats>({ 
    total: 0, 
    pending: 0, 
    in_progress: 0, 
    approved: 0,
    completed: 0, 
    rejected: 0 
  });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Load statistics on mount and when filter type changes
  useEffect(() => {
    loadStats();
  }, [filterType]);

  // Load tickets when filters change
  useEffect(() => {
    loadTickets(1);
  }, [filterStatus, searchTerm, filterType]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const query = ['admin_view=true']; // Admin view - see all tickets
      if (filterType !== 'all') {
        query.push(`type=${filterType}`);
      }
      
      const response = await api.get<any>(`tickets-counts?${query.join('&')}`);
      const statsData = response.counts || response;
      
      setStats({
        total: statsData.total || 0,
        pending: statsData.pending || 0,
        in_progress: statsData.in_progress || 0,
        approved: statsData.approved || 0,
        completed: statsData.completed || 0,
        rejected: statsData.rejected || 0,
      });
    } catch (err) {
      console.error('Failed to load ticket stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTickets = async (page: number = 1) => {
    setLoading(true);
    try {
      const query = [];
      query.push(`page=${page}`);
      query.push(`per_page=15`);
      
      // Add search parameter
      if (searchTerm) {
        query.push(`search=${encodeURIComponent(searchTerm)}`);
      }
      
      // Add type filter
      if (filterType !== 'all') {
        query.push(`type=${filterType}`);
      }
      
      // Add status filter
      if (filterStatus !== 'all') {
        query.push(`status=${filterStatus}`);
      }

      const url = `tickets?${query.join('&')}`;
      const res: any = await api.get(url);
      
      const data = Array.isArray(res) ? res : (res?.data || []);
      const responseMeta = res?.meta || res;
      
      console.log('📊 Ticket List - Loaded tickets:', {
        count: data.length,
        firstTicket: data[0],
        hasMeta: !!responseMeta,
      });
      
      setTickets(data);
      setPagination({
        total: responseMeta.total || 0,
        per_page: responseMeta.per_page || 15,
        current_page: responseMeta.current_page || page,
        last_page: responseMeta.last_page || 1,
        from: responseMeta.from || ((page - 1) * 15) + 1,
        to: responseMeta.to || Math.min(page * 15, responseMeta.total || 0),
        has_more: responseMeta.has_more !== undefined ? responseMeta.has_more : responseMeta.current_page < responseMeta.last_page,
      });
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (!pagination || pagination.current_page <= 1) return;
    loadTickets(pagination.current_page - 1);
  };

  const handleNextPage = () => {
    if (!pagination || !pagination.has_more) return;
    loadTickets(pagination.current_page + 1);
  };

  const handleRefreshData = async () => {
    await loadStats();
    loadTickets(1);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800' },
      assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
      on_hold: { label: 'On Hold', color: 'bg-orange-100 text-orange-800' },
      resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
      waiting_for_pegawai: { label: 'Waiting for Pegawai', color: 'bg-purple-100 text-purple-800' },
      closed: { label: 'Closed', color: 'bg-green-100 text-green-800' },
      closed_unrepairable: { label: 'Unrepairable', color: 'bg-red-100 text-red-800' },
      pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'perbaikan':
        return Wrench;
      case 'zoom_meeting':
        return Video;
      default:
        return AlertCircle;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'perbaikan': 'Perbaikan',
      'zoom_meeting': 'Zoom Meeting',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'perbaikan': 'bg-orange-100 text-orange-800',
      'zoom_meeting': 'bg-purple-100 text-purple-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Kelola Tiket</h1>
          <p className="text-muted-foreground">Review dan kelola semua tiket dari pengguna</p>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari tiket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
            
            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="perbaikan">Perbaikan</SelectItem>
                <SelectItem value="zoom_meeting">Zoom Meeting</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Semua ({statsLoading ? '...' : stats.total})
                </SelectItem>
                <SelectItem value="pending_review">
                  Pending ({statsLoading ? '...' : stats.pending})
                </SelectItem>
                <SelectItem value="approved">
                  Disetujui ({statsLoading ? '...' : stats.approved})
                </SelectItem>
                <SelectItem value="completed">
                  Selesai ({statsLoading ? '...' : stats.completed})
                </SelectItem>
                <SelectItem value="rejected">
                  Ditolak ({statsLoading ? '...' : stats.rejected})
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button 
              variant="outline" 
              onClick={handleRefreshData} 
              disabled={loading || statsLoading}
              className="h-10"
            >
              <RotateCcw className={`h-4 w-4 mr-2 ${loading || statsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RotateCcw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-3" />
              <p className="text-lg font-medium">Tidak ada tiket</p>
              <p className="text-sm">Belum ada tiket yang sesuai dengan filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket, index) => {
                const TypeIcon = getTypeIcon(ticket.type);
                
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewTicket(ticket.id)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          {/* Left: Icon & Content */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <TypeIcon className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Title & Ticket Number */}
                              <div className="flex items-start gap-2 mb-1">
                                <h3 className="font-semibold text-sm line-clamp-1 flex-1">
                                  {ticket.title}
                                </h3>
                              </div>
                              
                              {/* Ticket Number */}
                              <p className="text-xs text-muted-foreground mb-2">
                                #{ticket.ticketNumber}
                              </p>
                              
                              {/* Metadata */}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <UserIcon className="h-3 w-3" />
                                  <span>{ticket.userName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(ticket.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Badges & Action */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <div className="flex flex-wrap gap-2 justify-end">
                              <Badge className={getTypeColor(ticket.type)}>
                                {getTypeLabel(ticket.type)}
                              </Badge>
                              {getStatusBadge(ticket.status)}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewTicket(ticket.id);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Lihat
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {pagination ? (
                <>
                  Menampilkan {pagination.from} - {pagination.to} dari {pagination.total} tiket
                </>
              ) : (
                'Memuat...'
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={!pagination || pagination.current_page <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </Button>
              
              <div className="text-sm text-muted-foreground px-3">
                Hal. {pagination?.current_page || 1} dari {pagination?.last_page || 1}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!pagination || !pagination.has_more || loading}
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
