import React, { useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import DatePicker from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User as UserIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { Ticket, ZoomTicket, User } from '@/types';

interface ZoomAccountColumn {
  id: string | number;
  accountId?: string | number | null;
  name: string;
  isActive: boolean;
  color: string;
  lightColor: string;
  borderColor: string;
  dotColor: string;
}

interface ZoomDailyGridProps {
  tickets: Ticket[];
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  currentUser?: User;
  onViewTicket?: (ticketId: string) => void;
  zoomAccounts?: ZoomAccountColumn[];
  isLoading?: boolean;
  errorMessage?: string | null;
}

// Time slots from 06:00 - 23:00, then 00:00 - 05:00 (24 hours total)
const TIME_HOURS = [
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, // 6 AM - 11 PM
  0, 1, 2, 3, 4, 5 // Midnight - 5 AM
];

// Constants for pixel-based calculations
const PIXELS_PER_HOUR = 96; // Height of each hour cell in pixels

// Helper function to get grid index for a given hour
const getGridIndex = (hour: number): number => {
  if (hour >= 6 && hour <= 23) {
    return hour - 6; // Hours 6-23 map to indices 0-17
  } else if (hour >= 0 && hour <= 5) {
    return hour + 18; // Hours 0-5 map to indices 18-23
  }
  return 0;
};

export const ZoomDailyGrid: React.FC<ZoomDailyGridProps> = ({
  tickets,
  selectedDate,
  onDateChange,
  currentUser,
  onViewTicket,
  zoomAccounts,
  isLoading,
  errorMessage
}) => {
  // Privacy filter for pegawai role
  const filterSensitiveInfo = (text: string) => {
    if (currentUser?.role === 'pegawai') {
      // Hide sensitive info with asterisks for privacy
      return text.replace(/\b\w{2,}\b/g, (match) => {
        if (match.length <= 3) return match;
        return match[0] + '*'.repeat(match.length - 2) + match.slice(-1);
      });
    }
    return text;
  };
  // Set default date to today if no date is selected
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date();
      onDateChange(today);
    }
  }, []);

  const handleCalendarDateChange = (date: Date) => {
    onDateChange(date);
  };

  // Navigate to previous day
  const handlePreviousDay = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  // Navigate to next day
  const handleNextDay = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  // Navigate to today
  const handleToday = () => {
    const today = new Date();
    onDateChange(today);
  };

  // Get bookings for selected date (backend shape)
  const getBookingsForDate = (): ZoomTicket[] => {
    if (!selectedDate) return [];

    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`; // local date to match backend format

    return tickets.filter((t): t is ZoomTicket => {
      if (t.type !== 'zoom_meeting') return false;
      if (t.status !== 'approved' && t.status !== 'pending_review') return false;
      return t.date === dateStr;
    });
  };

  const bookings = getBookingsForDate();

  // Calculate booking position and height based on time (vertical layout)
  const getBookingStyle = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    // Get grid indices for start and end times
    const startIndex = getGridIndex(startHour);
    const endIndex = getGridIndex(endHour);

    // Convert to minutes relative to grid start
    const startMinutes = startIndex * 60 + startMin;
    let endMinutes = endIndex * 60 + endMin;

    // Handle case where end is before start (shouldn't happen with our grid, but just in case)
    if (endMinutes <= startMinutes) {
      endMinutes = startMinutes + 60; // Default to 1 hour
    }

    const durationMinutes = endMinutes - startMinutes;

    // Calculate pixel positions
    const topPx = (startMinutes / 60) * PIXELS_PER_HOUR;
    const heightPx = (durationMinutes / 60) * PIXELS_PER_HOUR;

    return {
      top: topPx,
      height: heightPx
    };
  };

  const accounts = useMemo(() => {
    if (zoomAccounts && zoomAccounts.length > 0) {
      return zoomAccounts.map((acc) => ({
        ...acc,
        color: acc.color ?? 'bg-blue-500',
        lightColor: acc.lightColor ?? 'bg-blue-100',
        borderColor: acc.borderColor ?? 'border-blue-300',
        dotColor: acc.dotColor ?? 'bg-blue-600',
        isActive: acc.isActive ?? true,
      }));
    }
    return [];
  }, [zoomAccounts]);

  const getAccountIdentifiers = (account: ZoomAccountColumn) =>
    [account.accountId, account.id].filter(Boolean).map((value) => String(value));

  const collectBookingIdentifiers = (booking: any) =>
    [
      booking.zoomAccountId,
      booking.zoom_account_id,
      booking.zoomAccountKey,
      booking.zoomAccount,
      booking.zoom_account,
      booking.zoomAccount?.id,
      booking.zoomAccount?.accountId,
      booking.zoom_account?.id,
      booking.zoom_account?.account_id,
    ]
      .filter(Boolean)
      .map((value) => String(value));

  const getAccountBookings = (account: ZoomAccountColumn, accountIndex: number) =>
    bookings.filter((booking: any) => {
      const bookingIds = collectBookingIdentifiers(booking);
      if (bookingIds.length === 0) {
        return accountIndex === 0;
      }
      const accountIds = getAccountIdentifiers(account);
      return bookingIds.some((id) => accountIds.includes(id));
    });

  const totalGridHeight = TIME_HOURS.length * PIXELS_PER_HOUR;
  const activeAccounts = accounts.filter((a: ZoomAccountColumn) => a.isActive);
  const totalCols = activeAccounts.length + 1; // +1 untuk Booking Pending

  return (
    <div className="space-y-4">
      {/* Date Picker Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Pilih Tanggal
              </CardTitle>
              <CardDescription>Masukkan tanggal untuk melihat ketersediaan slot Zoom</CardDescription>
            </div>
            <div className="min-w-[260px]">
              <DatePicker
                value={(selectedDate || undefined)}
                onChange={(d) => d && handleCalendarDateChange(d)}
                placeholder="Pilih Tanggal"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid View - Calendar Style */}
      {!selectedDate && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-gray-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Silakan pilih tanggal terlebih dahulu</p>
              <p className="text-sm mt-2">Gunakan form di atas untuk memilih tanggal yang ingin Anda lihat</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle>Ketersediaan Zoom</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePreviousDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Hari Ini
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextDay}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="mb-3 text-sm text-gray-500">
                Memuat data ketersediaan Zoom...
              </div>
            )}
            {errorMessage && (
              <div className="mb-3 text-sm text-red-600">
                {errorMessage}
              </div>
            )}
            <ScrollArea className="w-full">
              <div className="w-full">
                {/* Grid Container */}
                <div className="flex overflow-hidden bg-white">
                  {/* Time Column */}
                  <div className="flex-shrink-0 w-24">
                    {/* Header Cell - Empty for mathematical axis look */}
                    <div className="h-12 border-b border-gray-300 flex items-center justify-center">
                    </div>
                    {/* Time Labels */}
                    {TIME_HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="border-b border-gray-300 relative"
                        style={{ height: `${PIXELS_PER_HOUR}px` }}
                      >
                        {hour !== 6 && (
                          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-gray-700 bg-white px-2">
                            {hour.toString().padStart(2, '0')}:00
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Account Columns */}
                  <div className="flex-1 flex border-l border-gray-300">
                    {accounts.map((account: ZoomAccountColumn, accountIndex: number) => {
                      const accountBookings = getAccountBookings(account, accountIndex);

                      return (
                        <div
                          key={String(account.id)}
                          className={`flex-1 border-r last:border-r-0 border-gray-300 ${accountIndex % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}`}
                        >
                          <div className={`h-12 ${account.isActive ? 'bg-gray-100' : 'bg-gray-200'} border-b border-gray-300 flex items-center justify-between px-3`}>
                            <span className="text-sm font-medium truncate">{account.name}</span>
                            <Badge variant="secondary" className={`text-xs ${account.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                              {account.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </div>

                          <div className="relative" style={{ height: `${totalGridHeight}px` }}>
                            {!account.isActive && (
                              <div className="absolute inset-0 bg-gray-100/60 z-20 flex items-center justify-center pointer-events-none">
                                <div className="text-center text-gray-500 text-xs font-medium">
                                  Akun Nonaktif
                                </div>
                              </div>
                            )}
                            {/* Hour Grid Lines */}
                            {TIME_HOURS.map((hour, index) => (
                              <div
                                key={hour}
                                className="absolute left-0 right-0 border-b border-gray-200"
                                style={{
                                  top: `${index * PIXELS_PER_HOUR}px`,
                                  height: `${PIXELS_PER_HOUR}px`
                                }}
                              />
                            ))}

                            {/* Booking Blocks */}
                            {accountBookings.map((booking, index) => {
                              const style = getBookingStyle((booking as any).startTime, (booking as any).endTime);
                              const isPending = booking.status === 'pending_review';

                              return (
                                <motion.div
                                  key={booking.id}
                                  initial={{ scale: 0.95, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                  className={`absolute left-2 right-2 ${isPending
                                    ? 'bg-yellow-400 border border-yellow-600 text-gray-900'
                                    : `${account.color} border ${account.borderColor} text-white`
                                    } p-2 shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow z-10`}
                                  style={{
                                    top: `${style.top}px`,
                                    height: `${style.height}px`,
                                    minHeight: '40px'
                                  }}
                                  onClick={() => onViewTicket?.(booking.id)}
                                >
                                  <div className="text-xs font-semibold truncate flex items-center gap-1">
                                    <span className="flex-1 truncate">{filterSensitiveInfo(booking.title)}</span>
                                    <ChevronDown className="h-3 w-3 flex-shrink-0" />
                                  </div>
                                  <div className="text-xs opacity-90 flex items-center gap-1 mt-0.5">
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {(booking as any).startTime} - {(booking as any).endTime}
                                    </span>
                                  </div>
                                  {style.height > 60 && (
                                    <div className="text-xs opacity-90 flex items-center gap-1 mt-0.5">
                                      <UserIcon className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{filterSensitiveInfo(booking.userName || '')}</span>
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm font-semibold mb-2">Keterangan:</p>

                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}
                  >
                    {activeAccounts.map((account: ZoomAccountColumn) => (
                      <div key={String(account.id)} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${account.color}`} />
                        <span className="text-sm">{account.name}</span>
                      </div>
                    ))}

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-400" />
                      <span className="text-sm">Booking Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};