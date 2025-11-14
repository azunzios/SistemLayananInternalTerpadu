import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { CheckCircle, Clock, XCircle, PowerOff } from 'lucide-react';
import type { Ticket } from '../types';

interface ZoomMonthlyCalendarProps {
  tickets: Ticket[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onBookingClick: (booking: Ticket) => void;
}

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

export const ZoomMonthlyCalendar: React.FC<ZoomMonthlyCalendarProps> = ({
  tickets,
  selectedDate,
  onDateChange,
  onBookingClick,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  
  // Load zoom accounts from localStorage - SHOW ALL accounts (both active and inactive)
  const [zoomAccounts, setZoomAccounts] = useState<any[]>(() => {
    const stored = localStorage.getItem('bps_ntb_zoom_accounts');
    if (stored) {
      const accounts = JSON.parse(stored);
      return accounts.map((acc: any, index: number) => {
        const colorConfig = COLOR_MAP[acc.color] || COLOR_MAP.blue;
        return {
          id: acc.id,
          name: acc.name,
          isActive: acc.isActive,
          dotColor: colorConfig.dotColor,
        };
      });
    }
    // Fallback
    return [
      { id: 'zoom1', name: 'Zoom 1', isActive: true, dotColor: 'bg-blue-600' },
      { id: 'zoom2', name: 'Zoom 2', isActive: true, dotColor: 'bg-purple-600' },
      { id: 'zoom3', name: 'Zoom 3', isActive: true, dotColor: 'bg-green-600' },
    ];
  });

  // Update zoom accounts when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('bps_ntb_zoom_accounts');
      if (stored) {
        const accounts = JSON.parse(stored);
        const mappedAccounts = accounts.map((acc: any) => {
          const colorConfig = COLOR_MAP[acc.color] || COLOR_MAP.blue;
          return {
            id: acc.id,
            name: acc.name,
            isActive: acc.isActive,
            dotColor: colorConfig.dotColor,
          };
        });
        setZoomAccounts(mappedAccounts);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdate', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleStorageChange);
    };
  }, []);

  // Get all days in the current month
  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the month starts
    const startDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [currentMonth]);

  // Update currentMonth when selectedDate changes (from parent navigation)
  useEffect(() => {
    setCurrentMonth(new Date(selectedDate));
  }, [selectedDate]);

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    return tickets.filter(t => {
      if (t.type !== 'zoom_meeting') return false;
      return t.data?.meetingDate === dateStr;
    }).sort((a, b) => {
      // Sort by start time
      const timeA = a.data?.startTime || '';
      const timeB = b.data?.startTime || '';
      return timeA.localeCompare(timeB);
    });
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
                className={`min-h-[180px] border-r border-b p-2 cursor-pointer transition-colors ${
                  isCurrentDay ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                } ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                onClick={() => onDateChange(date)}
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

                {/* Booking List - Show ALL bookings regardless of account status */}
                <div className="space-y-1">
                  {bookings.map((booking) => {
                    const zoomAccountId = booking.data?.zoomAccount;
                    const account = zoomAccounts.find(acc => acc.id === zoomAccountId);
                    const isAccountActive = account?.isActive ?? true;

                    return (
                      <div
                        key={booking.id}
                        className={`flex items-start gap-1.5 text-xs group/booking hover:bg-white/50 rounded px-1 py-0.5 transition-colors ${!isAccountActive && 'opacity-60'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookingClick(booking);
                        }}
                      >
                        <div className={`w-2 h-2 rounded-full ${isAccountActive ? (account?.dotColor || 'bg-gray-400') : 'bg-gray-400'} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">
                            <span className="font-semibold">{booking.data?.startTime}</span>{' '}
                            <span className={isAccountActive ? 'text-gray-700' : 'text-gray-500'}>{booking.title}</span>
                            {!isAccountActive && (
                              <span className="text-gray-400 ml-1">(Nonaktif)</span>
                            )}
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
