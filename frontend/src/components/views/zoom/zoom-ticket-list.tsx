import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ZoomAdminReviewModal } from './zoom-admin-review-modal';
import { AlertCircle, Search, RotateCw, Eye, Calendar, Clock, Video, Loader, Loader2, Download } from 'lucide-react';
import type { Ticket, ZoomTicket } from '@/types';
import { api } from '@/lib/api';

interface ZoomTicketListProps {
  tickets: Ticket[];
  onViewDetail?: (ticketId: string) => void;
}

interface TicketStats {
  total: number;
  pending: number;
  approved: number;
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

export const ZoomTicketList: React.FC<ZoomTicketListProps> = ({ onViewDetail }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [zoomTickets, setZoomTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<TicketStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<ZoomTicket | null>(null);

  // Load statistics on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Load tickets when tab or searchTerm changes
  useEffect(() => {
    loadTickets(1);
  }, [selectedTab, searchTerm]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await api.get<any>('tickets-counts?type=zoom_meeting');
      const statsData = response.counts || response;

      // Zoom hanya punya 3 status: pending_review, approved, rejected
      const pending = statsData.pending || 0;
      const approved = (statsData.approved || 0);
      const rejected = statsData.rejected || 0;

      setStats({
        total: statsData.total || 0,
        pending: pending,
        approved: approved,
        rejected: rejected,
      });
    } catch (err) {
      console.error('Failed to load zoom ticket stats:', err);
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
      query.push(`type=zoom_meeting`);

      // Add search parameter
      if (searchTerm) {
        query.push(`search=${encodeURIComponent(searchTerm)}`);
      }

      // Add status filter based on tab
      if (selectedTab === 'pending') {
        query.push(`status=pending_review`);
      } else if (selectedTab === 'approved') {
        query.push(`status=approved`);
      } else if (selectedTab === 'rejected') {
        query.push(`status=rejected`);
      }

      const url = `tickets?${query.join('&')}`;
      const res: any = await api.get(url);

      const data = Array.isArray(res) ? res : (res?.data || []);
      const responseMeta = res?.meta || res;

      setZoomTickets(data);
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
      console.error('Failed to load zoom tickets:', err);
      setZoomTickets([]);
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

  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      // Get token from sessionStorage (same as api helper)
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const baseUrl = (import.meta.env.VITE_API as string || '').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/tickets/export/zoom`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tiket_zoom_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewDetail = (ticketId: string) => {
    const ticket = zoomTickets.find(t => t.id === ticketId);
    if (ticket && ticket.type === 'zoom_meeting') {
      setSelectedBooking(ticket as ZoomTicket);
    }
  };

  const handleModalClose = () => {
    setSelectedBooking(null);
  };

  const handleModalUpdate = () => {
    handleRefreshData();
    if (onViewDetail && selectedBooking) {
      onViewDetail(selectedBooking.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Responsive: Flex-col on mobile */}
      <div className="flex items-start justify-between max-md:flex-col max-md:items-start max-md:gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-start gap-3">
            Daftar Tiket Zoom Meeting
          </h1>
          <p className="text-muted-foreground text-sm">Kelola semua permintaan booking Zoom meeting</p>
        </div>
        <div className="flex items-center gap-3 max-md:w-full">
          {/* Button Clean Outline Full Rounded */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={exporting}
            className="h-8 rounded-full border-slate-300 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-black transition-all max-md:w-full"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-2 h-3.5 w-3.5 text-slate-500" />
            )}
            Unduh Laporan (.xlsx)
          </Button>
        </div>
      </div>

      {/* Filter Controls - Responsive: Flex-col and stretch on mobile */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between gap-4 max-md:items-stretch">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari tiket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
                        <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={loading || statsLoading}
              className="h-8"
            >
              <RotateCw className={`h-4 w-4 ${loading || statsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Tabs */}
      <Card>
        <CardContent className="p-4">
          <Tabs value={selectedTab} onValueChange={(val) => setSelectedTab(val as any)} className="w-full">
            {/* Tabs List - Responsive: 2 cols on mobile, auto height */}
            <TabsList className="grid grid-cols-4 w-full max-md:grid-cols-2 max-md:h-auto">
              <TabsTrigger value="all" className="cursor-pointer hover:bg-accent">
                Semua {statsLoading ? <Loader className="h-3 w-3 animate-spin ml-1" /> : `(${stats.total})`}
              </TabsTrigger>
              <TabsTrigger value="pending" className="cursor-pointer hover:bg-accent">
                Pending {statsLoading ? <Loader className="h-3 w-3 animate-spin ml-1" /> : `(${stats.pending})`}
              </TabsTrigger>
              <TabsTrigger value="approved" className="cursor-pointer hover:bg-accent">
                Disetujui {statsLoading ? <Loader className="h-3 w-3 animate-spin ml-1" /> : `(${stats.approved})`}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="cursor-pointer hover:bg-accent">
                Ditolak {statsLoading ? <Loader className="h-3 w-3 animate-spin ml-1" /> : `(${stats.rejected})`}
              </TabsTrigger>
            </TabsList>

            {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4">
                {loading ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-16">
                      <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                    </CardContent>
                  </Card>
                ) : zoomTickets.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Tidak ada tiket</h3>
                      <p className="text-muted-foreground text-center">
                        {tab === 'all' && 'Belum ada tiket zoom meeting'}
                        {tab === 'pending' && 'Tidak ada tiket pending'}
                        {tab === 'approved' && 'Tidak ada tiket disetujui'}
                        {tab === 'rejected' && 'Tidak ada tiket ditolak'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      {zoomTickets.map((ticket) => (
                        <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewDetail(ticket.id)}>
                          <CardContent className="p-4">
                            {/* Card Item - Responsive: Flex-col on mobile */}
                            <div className="flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-3">
                              <div className="flex-1 space-y-2 w-full">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Video className="h-5 w-5 text-purple-600" />
                                    <h3 className="font-semibold text-lg line-clamp-1">{ticket.title}</h3>
                                  </div>
                                  <Badge className="bg-purple-100 text-purple-800 shrink-0">
                                    Zoom
                                  </Badge>
                                </div>
                                
                                {/* Meta Info - Responsive: Wrap on mobile */}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground max-md:flex-wrap max-md:gap-y-2 max-md:gap-x-3">
                                  <span className="font-mono">{ticket.ticketNumber}</span>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{(ticket as ZoomTicket).date ? formatDate((ticket as ZoomTicket).date) : '-'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{(ticket as ZoomTicket).startTime || '-'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {getStatusBadge(ticket.status)}
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  <span className="font-medium">{ticket.userName}</span>
                                  {ticket.unitKerja && <span> • {ticket.unitKerja}</span>}
                                </div>
                              </div>
                              <div className="flex-shrink-0 max-md:hidden">
                                <Button variant="link" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Pagination - Responsive: Flex-col on mobile */}
                    <Card>
                      <CardContent className="flex items-center justify-between py-4 max-md:flex-col max-md:gap-4 max-md:items-center">
                        <div className="text-sm text-muted-foreground text-center">
                          {pagination && `Halaman ${pagination.current_page} dari ${pagination.last_page} • ${pagination.from}-${pagination.to} dari ${pagination.total}`}
                        </div>
                        <div className="flex gap-2 w-full justify-center md:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={!pagination || pagination.current_page === 1 || loading}
                            className="cursor-pointer max-md:flex-1"
                          >
                            Sebelumnya
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={!pagination || !pagination.has_more || loading}
                            className="cursor-pointer max-md:flex-1"
                          >
                            Berikutnya
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedBooking && (
        <ZoomAdminReviewModal
          booking={selectedBooking}
          onClose={handleModalClose}
          onUpdate={handleModalUpdate}
        />
      )}
    </div>
  );
};