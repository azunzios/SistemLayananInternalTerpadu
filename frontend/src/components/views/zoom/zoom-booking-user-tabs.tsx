import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar as CalendarIcon, CheckCircle, Clock, Search, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookingGroups, ZoomAccountUi } from './zoom-booking-types';
import type { User } from '@/types';
import { ZoomDailyGrid } from './zoom-daily-grid';
import { api } from '@/lib/api';

interface ZoomBookingStats {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface ZoomBookingItem {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  estimatedParticipants: number;
  userName: string;
  userId: string;
  zoomAccountId: number;
  zoomAccount?: any;
  meetingLink?: string;
  passcode?: string;
  coHosts: any[];
  rejectionReason?: string;
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

interface ZoomBookingUserTabsProps {
  bookingGroups: BookingGroups;
  selectedDate?: Date;
  dailyTickets: any[];
  isLoadingDaily: boolean;
  dailyError: string | null;
  currentUser: User;
  zoomAccounts: ZoomAccountUi[];
  onDateChange: (date: Date) => void;
  onViewTicketById: (ticketId: string) => void;
  onSelectBooking: (booking: any) => void;
  renderStatusBadge: (status: string) => React.ReactNode;
}

const STATUS_FILTER_MAP: Record<string, string | undefined> = {
  all: undefined,
  pending: 'pending_review',
  approved: 'approved',
  rejected: 'rejected',
};

export const ZoomBookingUserTabs: React.FC<ZoomBookingUserTabsProps> = ({
  selectedDate,
  dailyTickets,
  isLoadingDaily,
  dailyError,
  currentUser,
  zoomAccounts,
  onDateChange,
  onViewTicketById,
  onSelectBooking,
  renderStatusBadge,
}) => {
  const [stats, setStats] = useState<ZoomBookingStats | null>(null);
  const [bookings, setBookings] = useState<ZoomBookingItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Load bookings when status or page changes
  useEffect(() => {
    loadBookings(currentStatus, currentPage);
  }, [currentStatus, currentPage]);

  const loadStats = async () => {
    try {
      const response = await api.get<{ success: boolean; stats: ZoomBookingStats }>(
        'tickets/stats/zoom-bookings'
      );
      if (response.success && response.stats) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Failed to load zoom booking stats:', err);
    }
  };

  const loadBookings = async (status: string, page: number) => {
    setIsLoadingBookings(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', '15');
      
      const statusFilter = STATUS_FILTER_MAP[status];
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await api.get<{
        success: boolean;
        data: ZoomBookingItem[];
        pagination: PaginationMeta;
      }>(`tickets/zoom-bookings?${params.toString()}`);

      if (response.success) {
        setBookings(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('Failed to load zoom bookings:', err);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleStatusChange = (newStatus: 'all' | 'pending' | 'approved' | 'rejected') => {
    setCurrentStatus(newStatus);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Tabs defaultValue="check-availability" className="space-y-4">
      <TabsList>
        <TabsTrigger value="check-availability" className="gap-2">
          <Search className="h-4 w-4" />
          Cek Ketersediaan
        </TabsTrigger>
        <TabsTrigger value="my-bookings" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          Booking Saya
        </TabsTrigger>
      </TabsList>

      <TabsContent value="check-availability" className="space-y-4">
        {!selectedDate ? (
          <div className="space-y-4">
            <ZoomDailyGrid
              tickets={dailyTickets}
              selectedDate={selectedDate ?? null}
              onDateChange={onDateChange}
              currentUser={currentUser}
              zoomAccounts={zoomAccounts}
              isLoading={isLoadingDaily}
              errorMessage={dailyError}
              onViewTicket={onViewTicketById}
            />

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                  {[...Array(10)].map((_, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <ZoomDailyGrid
            tickets={dailyTickets}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            currentUser={currentUser}
            zoomAccounts={zoomAccounts}
            isLoading={isLoadingDaily}
            errorMessage={dailyError}
            onViewTicket={onViewTicketById}
          />
        )}
      </TabsContent>

      <TabsContent value="my-bookings" className="space-y-4">
        <Tabs value={currentStatus} onValueChange={(val) => handleStatusChange(val as any)}>
          <TabsList>
            <TabsTrigger value="all">
              Semua ({stats?.all ?? '-'})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({stats?.pending ?? '-'})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Disetujui ({stats?.approved ?? '-'})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              Ditolak ({stats?.rejected ?? '-'})
            </TabsTrigger>
          </TabsList>

          <Card>
            <CardContent className="p-0">
              {isLoadingBookings ? (
                <div className="p-8 text-center">
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nomor Tiket</TableHead>
                        <TableHead>Judul</TableHead>
                        <TableHead>Tanggal & Waktu</TableHead>
                        <TableHead>Peserta</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>Tidak ada booking</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        bookings.map(booking => (
                          <TableRow key={booking.id} className="hover:bg-gray-50">
                            <TableCell className="font-mono text-sm">{booking.ticketNumber}</TableCell>
                            <TableCell>
                              <p>{booking.title}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">
                                {new Date(booking.date).toLocaleDateString('id-ID')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {booking.startTime} - {booking.endTime}
                              </p>
                            </TableCell>
                            <TableCell className="text-sm">{booking.estimatedParticipants} orang</TableCell>
                            <TableCell> {renderStatusBadge(booking.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:underline hover:text-blue-500"
                                onClick={() => onSelectBooking(booking)}
                              >
                                Detail
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {pagination && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                      <p className="text-sm text-gray-600">
                        Menampilkan {pagination.from} - {pagination.to} dari {pagination.total}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Sebelumnya
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagination.has_more}
                        >
                          Selanjutnya
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
};
