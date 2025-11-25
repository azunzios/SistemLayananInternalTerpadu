import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar as CalendarIcon, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { BookingGroups } from './zoom-booking-types';
import type { User } from '@/types';
import { ZoomCalendarView } from './zoom-calendar-view';

interface ZoomBookingManagementTabsProps {
  bookingGroups: BookingGroups;
  currentUser: User;
  onSelectBooking: (booking: any) => void;
  renderStatusBadge: (status: string) => React.ReactNode;
}

const STATUS_TABS: Array<'all' | 'pending' | 'approved' | 'rejected'> = [
  'all',
  'pending',
  'approved',
  'rejected',
];

export const ZoomBookingManagementTabs: React.FC<ZoomBookingManagementTabsProps> = ({
  bookingGroups,
  currentUser,
  onSelectBooking,
  renderStatusBadge,
}) => {
  return (
    <Tabs defaultValue="calendar" className="space-y-4">
      <TabsList>
        <TabsTrigger value="calendar" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          Kalender
        </TabsTrigger>
        <TabsTrigger value="all">Semua ({bookingGroups.all.length})</TabsTrigger>
        <TabsTrigger value="pending" className="gap-2">
          <Clock className="h-4 w-4" />
          Pending ({bookingGroups.pending.length})
        </TabsTrigger>
        <TabsTrigger value="approved" className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Disetujui ({bookingGroups.approved.length})
        </TabsTrigger>
        <TabsTrigger value="rejected" className="gap-2">
          <XCircle className="h-4 w-4" />
          Ditolak ({bookingGroups.rejected.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="calendar">
        <ZoomCalendarView currentUser={currentUser} />
      </TabsContent>

      {STATUS_TABS.map(tab => (
        <TabsContent key={tab} value={tab}>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Tiket</TableHead>
                    <TableHead>Pemohon</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Tanggal & Waktu</TableHead>
                    <TableHead>Peserta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingGroups[tab].length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Tidak ada booking</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookingGroups[tab].map(booking => (
                      <TableRow key={booking.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm">{booking.ticketNumber}</TableCell>
                        <TableCell>
                          <p>{booking.userName}</p>
                          <p className="text-xs text-gray-500">{booking.unitKerja}</p>
                        </TableCell>
                        <TableCell>
                          <p>{booking.title}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {booking.date && new Date(booking.date).toLocaleDateString('id-ID')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.startTime} - {booking.endTime}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">{booking.estimatedParticipants} orang</TableCell>
                        <TableCell>{renderStatusBadge(booking.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="link"
                            size="sm"
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
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
};
