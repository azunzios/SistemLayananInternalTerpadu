import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { CheckCircle, Clock, XCircle, PowerOff } from 'lucide-react';
import { api } from '@/lib/api';

// Color mapping
const COLOR_MAP: Record<string, { dotColor: string }> = {
  blue: { dotColor: 'bg-blue-600' },
  purple: { dotColor: 'bg-purple-600' },
  green: { dotColor: 'bg-green-600' },
  orange: { dotColor: 'bg-orange-600' },
  red: { dotColor: 'bg-red-600' },
  teal: { dotColor: 'bg-teal-600' },
  indigo: { dotColor: 'bg-indigo-600' },
  pink: { dotColor: 'bg-pink-600' },
};

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface ZoomMonthlyCalendarProps {
  tickets: ZoomCalendarEntry[];
  selectedDate: Date;
}

type ZoomCalendarEntry = {
  id: string | number;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  title?: string;
  userName?: string;
  zoomAccountId?: string | number | null;
  zoomAccountKey?: string | number | null;
  zoomAccount?: {
    id?: string | number;
    accountId?: string;
    name?: string;
    is_active?: boolean;
    isActive?: boolean;
  };
};

type ZoomAccountMeta = {
  id: string | number;
  accountId?: string | number | null;
  name: string;
  isActive: boolean;
  dotColor: string;
};

const STATUS_META: Record<string, { icon: typeof CheckCircle; label: string; color: string }> = {
  approved: { icon: CheckCircle, label: 'Disetujui', color: 'text-green-600' },
  menunggu_review: { icon: Clock, label: 'Menunggu Review', color: 'text-yellow-600' },
  pending_review: { icon: Clock, label: 'Pending Review', color: 'text-yellow-600' },
  pending_approval: { icon: Clock, label: 'Pending Approval', color: 'text-yellow-600' },
  ditolak: { icon: XCircle, label: 'Ditolak', color: 'text-red-600' },
  rejected: { icon: XCircle, label: 'Ditolak', color: 'text-red-600' },
};

const getStatusMeta = (status?: string) => {
  if (!status) {
    return { icon: Clock, label: 'Tidak diketahui', color: 'text-gray-500' };
  }
  return STATUS_META[status] ?? { icon: Clock, label: status, color: 'text-gray-500' };
};

export const ZoomMonthlyCalendar: React.FC<ZoomMonthlyCalendarProps> = ({
  tickets,
  selectedDate,
}) => {
  const [zoomAccounts, setZoomAccounts] = useState<ZoomAccountMeta[]>(() => [
    { id: 'zoom1', accountId: 'zoom1', name: 'Zoom 1', isActive: true, dotColor: 'bg-blue-600' },
    { id: 'zoom2', accountId: 'zoom2', name: 'Zoom 2', isActive: true, dotColor: 'bg-purple-600' },
    { id: 'zoom3', accountId: 'zoom3', name: 'Zoom 3', isActive: true, dotColor: 'bg-green-600' },
  ]);

  useEffect(() => {
    const loadZoomAccounts = async () => {
      try {
        const accounts = await api.get('zoom/accounts');
        if (Array.isArray(accounts)) {
          const mappedAccounts = accounts.map((acc: any) => {
            const colorConfig = COLOR_MAP[acc.color] || COLOR_MAP.blue;
            return {
              id: acc.id,
              accountId: acc.account_id ?? acc.accountId ?? null,
              name: acc.name,
              isActive: acc.is_active ?? acc.isActive ?? true,
              dotColor: colorConfig.dotColor,
            };
          });
          setZoomAccounts(mappedAccounts);
        }
      } catch (err) {
        console.error('Failed to load zoom accounts:', err);
      }
    };
    loadZoomAccounts();
  }, []);

  const monthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [selectedDate]);

  const getBookingsForDate = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return tickets
      .filter((ticket) => {
        if (!ticket?.date) return false;
        const normalized = typeof ticket.date === 'string' ? ticket.date.split('T')[0] : ticket.date;
        return normalized === dateStr;
      })
      .sort((a, b) => {
        const timeA = a.startTime ?? '';
        const timeB = b.startTime ?? '';
        return timeA.localeCompare(timeB);
      });
  };

  const findAccountForBooking = (booking: ZoomCalendarEntry) => {
    const bookingIds = [
      booking.zoomAccountId,
      booking.zoomAccount?.id,
      booking.zoomAccount?.accountId,
      booking.zoomAccountKey,
    ]
      .filter(Boolean)
      .map((value) => String(value));

    if (bookingIds.length === 0) {
      return null;
    }

    return zoomAccounts.find((acc) => {
      const accIds = [acc.id, acc.accountId]
        .filter(Boolean)
        .map((value) => String(value));
      return bookingIds.some((id) => accIds.includes(id));
    }) ?? null;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="space-y-4">
      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-100 border-b">
          {WEEKDAYS.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {monthDays.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[180px] border-r border-b bg-gray-50"
                />
              );
            }

            const bookings = getBookingsForDate(date);
            const isCurrentDay = isToday(date);
            const isSelected = isSelectedDate(date);

            return (
              <motion.div
                key={date.toISOString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.01 }}
                className={`min-h-[180px] border-r border-b p-2 transition-colors ${
                  isCurrentDay ? 'bg-blue-50 border-blue-300' : ''
                } ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-semibold ${
                      isCurrentDay
                        ? 'bg-blue-600 text-white h-6 w-6 rounded-full flex items-center justify-center'
                        : 'text-gray-700'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {bookings.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {bookings.length}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  {bookings.map((booking) => {
                    const account = findAccountForBooking(booking);
                    const isAccountActive = account?.isActive ?? true;
                    const statusMeta = getStatusMeta(booking.status);
                    const StatusIcon = statusMeta.icon;

                    return (
                      <div
                        key={booking.id}
                        className={`flex items-start gap-1.5 text-xs rounded px-1 py-0.5 ${
                          !isAccountActive ? 'opacity-60' : ''
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isAccountActive ? (account?.dotColor || 'bg-gray-400') : 'bg-gray-400'
                          } flex-shrink-0 mt-0.5`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">
                            <span className="font-semibold">{booking.startTime ?? '-'}</span>{' '}
                            <span className={isAccountActive ? 'text-gray-700' : 'text-gray-500'}>
                              {booking.title}
                            </span>
                          </div>
                          <div className={`flex items-center gap-1 mt-0.5 text-[10px] ${statusMeta.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            <span>{statusMeta.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend - Moved to bottom */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <p className="text-sm font-semibold">Keterangan Akun Zoom:</p>
            {zoomAccounts.map((account) => {
              return (
                <div key={account.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${account.isActive ? account.dotColor : 'bg-gray-400'}`} />
                  <span className="text-sm">{account.name}</span>
                  {!account.isActive && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 gap-1">
                      <PowerOff className="h-3 w-3" />
                      Nonaktif
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-6 flex-wrap mt-3">
            <p className="text-sm font-semibold">Status Booking:</p>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Disetujui</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Ditolak</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
