import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Search,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { BookingGroups, ZoomAccountUi } from "./zoom-booking-types";
import type { User } from "@/types";
import { ZoomDailyGrid } from "./zoom-daily-grid";
import { api } from "@/lib/api";

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
  breakoutRooms: number;
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
  pending: "pending_review",
  approved: "approved",
  rejected: "rejected",
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
  const [currentStatus, setCurrentStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
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
      const response = await api.get<{
        success: boolean;
        stats: ZoomBookingStats;
      }>("tickets/stats/zoom-bookings");
      if (response.success && response.stats) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error("Failed to load zoom booking stats:", err);
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
        params.append("status", statusFilter);
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
      console.error("Failed to load zoom bookings:", err);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleStatusChange = (
    newStatus: "all" | "pending" | "approved" | "rejected"
  ) => {
    setCurrentStatus(newStatus);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Tabs defaultValue="check-availability" className="space-y-4">
      {/* MODIFIKASI 1: Main Tabs 
        - TabsList diberi w-full agar memenuhi lebar
        - TabsTrigger diberi flex-1 agar ukuran tombol sama rata
        - Teks dibungkus span dengan className="max-md:hidden" (sembunyi di mobile)
      */}
      <TabsList className="w-full">
        <TabsTrigger value="check-availability" className="gap-2 cursor-pointer hover:bg-white flex-1">
          <Search className="h-4 w-4" />
          <span className="max-md:hidden">Cek Ketersediaan</span>
        </TabsTrigger>
        <TabsTrigger value="my-bookings" className="gap-2 cursor-pointer hover:bg-white flex-1">
          <CalendarIcon className="h-4 w-4" />
          <span>Booking Saya</span>
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

          {/* MODIFIKASI 2: Status Tabs (Filter)
            - TabsList diberi w-full dan h-auto agar fleksibel
            - TabsTrigger diberi flex-1
            - Label teks ("Pending", "Disetujui", dll) di-hide di mobile (max-md:hidden)
            - Angka statistik tetap dimunculkan
          */}
          <TabsList className="w-full h-auto flex-wrap sm:flex-nowrap">
            <TabsTrigger value="all" className="flex-1">
              <span>Semua</span>
              <span className="max-md:hidden">({stats?.all ?? '-'})</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-[2px] flex-1">
              <Clock className="h-4 w-4" />
              <span className="">Pending</span>
              <span className="max-md:hidden">({stats?.pending ?? '-'})</span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-[2px] flex-1">
              <CheckCircle className="h-4 w-4" />
              <span className="">Disetujui</span>
              <span className="max-md:hidden">({stats?.approved ?? '-'})</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-[2px] flex-1">
              <XCircle className="h-4 w-4" />
              <span className="">Ditolak</span>
              <span className="max-md:hidden">({stats?.rejected ?? '-'})</span>
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
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-12 text-gray-500"
                          >
                            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>Tidak ada booking</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        bookings.map((booking) => (
                          <TableRow
                            key={booking.id}
                            className="hover:bg-gray-50"
                          >
                            <TableCell className="font-mono text-sm">
                              {booking.ticketNumber}
                            </TableCell>
                            <TableCell>
                              <p>{booking.title}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">
                                {new Date(booking.date).toLocaleDateString(
                                  "id-ID"
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                {booking.startTime} - {booking.endTime}
                              </p>
                            </TableCell>
                            <TableCell className="text-sm">
                              {booking.estimatedParticipants} orang
                            </TableCell>
                            <TableCell>
                              {" "}
                              {renderStatusBadge(booking.status)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="link"
                                size="sm"
                                className="hover:underline hover:text-blue-500 cursor-pointer"
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
                        Menampilkan {pagination.from} - {pagination.to} dari{" "}
                        {pagination.total}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="max-md:hidden">Sebelumnya</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagination.has_more}
                          className="cursor-pointer"
                        >
                          <span className="max-md:hidden">Selanjutnya</span>
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
