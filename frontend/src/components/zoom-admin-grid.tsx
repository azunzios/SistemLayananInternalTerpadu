import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { ScrollArea } from './ui/scroll-area';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from './ui/tabs';
import { 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
  Eye,
  CalendarDays,
  List,
  LayoutGrid,
  Link as LinkIcon,
  Key,
  Lock,
  ExternalLink,
  Send,
  Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ZoomMonthlyCalendar } from './zoom-monthly-calendar';
import { ZoomAdminReviewModal } from './zoom-admin-review-modal';
import { getTickets, saveTickets, createNotification } from '../lib/storage';
import type { Ticket } from '../types';

interface ZoomAdminGridProps {
  tickets: Ticket[];
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
}

// Time slots from 06:00 - 23:00, then 00:00 - 05:00 (24 hours total)
const TIME_HOURS = [
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, // 6 AM - 11 PM
  0, 1, 2, 3, 4, 5 // Midnight - 5 AM
];

// Color mapping for different colors
const COLOR_MAP: Record<string, { color: string; lightColor: string; borderColor: string; hoverColor: string; dotColor: string }> = {
  blue: { 
    color: 'bg-blue-500', 
    lightColor: 'bg-blue-100', 
    borderColor: 'border-blue-300', 
    hoverColor: 'hover:bg-blue-50',
    dotColor: 'bg-blue-600'
  },
  purple: { 
    color: 'bg-purple-500', 
    lightColor: 'bg-purple-100', 
    borderColor: 'border-purple-300', 
    hoverColor: 'hover:bg-purple-50',
    dotColor: 'bg-purple-600'
  },
  green: { 
    color: 'bg-green-500', 
    lightColor: 'bg-green-100', 
    borderColor: 'border-green-300', 
    hoverColor: 'hover:bg-green-50',
    dotColor: 'bg-green-600'
  },
  orange: { 
    color: 'bg-orange-500', 
    lightColor: 'bg-orange-100', 
    borderColor: 'border-orange-300', 
    hoverColor: 'hover:bg-orange-50',
    dotColor: 'bg-orange-600'
  },
  red: { 
    color: 'bg-red-500', 
    lightColor: 'bg-red-100', 
    borderColor: 'border-red-300', 
    hoverColor: 'hover:bg-red-50',
    dotColor: 'bg-red-600'
  },
  teal: { 
    color: 'bg-teal-500', 
    lightColor: 'bg-teal-100', 
    borderColor: 'border-teal-300', 
    hoverColor: 'hover:bg-teal-50',
    dotColor: 'bg-teal-600'
  },
  indigo: { 
    color: 'bg-indigo-500', 
    lightColor: 'bg-indigo-100', 
    borderColor: 'border-indigo-300', 
    hoverColor: 'hover:bg-indigo-50',
    dotColor: 'bg-indigo-600'
  },
  pink: { 
    color: 'bg-pink-500', 
    lightColor: 'bg-pink-100', 
    borderColor: 'border-pink-300', 
    hoverColor: 'hover:bg-pink-50',
    dotColor: 'bg-pink-600'
  },
};

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

export const ZoomAdminGrid: React.FC<ZoomAdminGridProps> = ({
  tickets,
  selectedDate,
  onDateChange,
}) => {
  // View mode state (daily or monthly)
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  
  // Display mode state (calendar or list) - for entire view
  const [displayMode, setDisplayMode] = useState<'calendar' | 'list'>('calendar');
  
  // Load zoom accounts from localStorage - SHOW ALL accounts (both active and inactive)
  const [zoomAccounts, setZoomAccounts] = useState<any[]>(() => {
    const stored = localStorage.getItem('bps_ntb_zoom_accounts');
    if (stored) {
      const accounts = JSON.parse(stored);
      // Map ALL accounts (don't filter by isActive)
      return accounts.map((acc: any, index: number) => {
          const accountNumber = index + 1;
          const colorConfig = COLOR_MAP[acc.color] || COLOR_MAP.blue;
          return {
            id: accountNumber,
            accountId: acc.id,
            name: acc.name,
            isActive: acc.isActive, // Keep the active status
            color: colorConfig.color,
            lightColor: colorConfig.lightColor,
            borderColor: colorConfig.borderColor,
            hoverColor: colorConfig.hoverColor,
            dotColor: colorConfig.dotColor,
          };
        });
    }
    // Fallback to default accounts if none found
    return [
      { id: 1, accountId: 'zoom1', name: 'Akun Zoom 1', isActive: true, color: 'bg-blue-500', lightColor: 'bg-blue-100', borderColor: 'border-blue-300', hoverColor: 'hover:bg-blue-50', dotColor: 'bg-blue-600' },
      { id: 2, accountId: 'zoom2', name: 'Akun Zoom 2', isActive: true, color: 'bg-purple-500', lightColor: 'bg-purple-100', borderColor: 'border-purple-300', hoverColor: 'hover:bg-purple-50', dotColor: 'bg-purple-600' },
      { id: 3, accountId: 'zoom3', name: 'Akun Zoom 3', isActive: true, color: 'bg-green-500', lightColor: 'bg-green-100', borderColor: 'border-green-300', hoverColor: 'hover:bg-green-50', dotColor: 'bg-green-600' },
    ];
  });

  // Update zoom accounts when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('bps_ntb_zoom_accounts');
      if (stored) {
        const accounts = JSON.parse(stored);
        const mappedAccounts = accounts.map((acc: any, index: number) => {
            const accountNumber = index + 1;
            const colorConfig = COLOR_MAP[acc.color] || COLOR_MAP.blue;
            return {
              id: accountNumber,
              accountId: acc.id,
              name: acc.name,
              isActive: acc.isActive,
              color: colorConfig.color,
              lightColor: colorConfig.lightColor,
              borderColor: colorConfig.borderColor,
              hoverColor: colorConfig.hoverColor,
              dotColor: colorConfig.dotColor,
            };
          });
        setZoomAccounts(mappedAccounts);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event when localStorage is updated in the same window
    const handleLocalUpdate = () => handleStorageChange();
    window.addEventListener('localStorageUpdate', handleLocalUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleLocalUpdate);
    };
  }, []);

  // Get today's date for placeholders
  const today = new Date();
  const todayDay = today.getDate().toString().padStart(2, '0');
  const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  const todayYear = today.getFullYear().toString();

  const [dateInput, setDateInput] = useState({
    day: '',
    month: '',
    year: '',
  });
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Ticket | null>(null);

  // Set default date to today if no date is selected
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date();
      onDateChange(today);
      setCalendarDate(today);
    }
  }, []);

  const handleDateSubmit = () => {
    const { day, month, year } = dateInput;
    
    if (!day || !month || !year) {
      return;
    }

    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Validation
    if (isNaN(date.getTime())) {
      return;
    }

    onDateChange(date);
  };

  const handleCalendarDateChange = (date: Date) => {
    setCalendarDate(date);
    onDateChange(date);
  };

  // Navigate to previous day
  const handlePreviousDay = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
    setCalendarDate(newDate);
  };

  // Navigate to next day
  const handleNextDay = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
    setCalendarDate(newDate);
  };

  // Navigate to today
  const handleToday = () => {
    const today = new Date();
    onDateChange(today);
    setCalendarDate(today);
  };

  // Navigate to previous month
  const handlePreviousMonth = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
    setCalendarDate(newDate);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
    setCalendarDate(newDate);
  };

  // Navigate to current month
  const handleThisMonth = () => {
    const today = new Date();
    onDateChange(today);
    setCalendarDate(today);
  };

  // Get bookings for selected date
  const getBookingsForDate = () => {
    if (!selectedDate) return [];

    const dateStr = selectedDate.toISOString().split('T')[0];
    
    return tickets.filter(t => {
      // Include all statuses for admin view
      if (t.type !== 'zoom_meeting') return false;
      return t.data?.meetingDate === dateStr;
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

  // Get bookings for specific account
  const getAccountBookings = (accountNumber: number) => {
    return bookings.filter(booking => {
      // Check which account this booking is assigned to
      const zoomAccount = booking.data?.zoomAccount;
      if (zoomAccount === 'zoom1') return accountNumber === 1;
      if (zoomAccount === 'zoom2') return accountNumber === 2;
      if (zoomAccount === 'zoom3') return accountNumber === 3;
      
      return false;
    });
  };

  const totalGridHeight = TIME_HOURS.length * PIXELS_PER_HOUR;

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          bg: 'bg-green-500',
          border: 'border-green-600',
          text: 'text-white',
          label: 'Disetujui',
          icon: CheckCircle
        };
      case 'menunggu_review':
      case 'pending_approval':
        return {
          bg: 'bg-yellow-400',
          border: 'border-yellow-600',
          text: 'text-gray-900',
          label: 'Pending',
          icon: Clock
        };
      case 'ditolak':
        return {
          bg: 'bg-red-500',
          border: 'border-red-600',
          text: 'text-white',
          label: 'Ditolak',
          icon: XCircle
        };
      default:
        return {
          bg: 'bg-gray-400',
          border: 'border-gray-600',
          text: 'text-white',
          label: status,
          icon: AlertCircle
        };
    }
  };

  // Count pending bookings
  const pendingCount = bookings.filter(b => 
    b.status === 'menunggu_review' || b.status === 'pending_approval'
  ).length;

  return (
    <div className="space-y-4">
      {/* Alert removed as requested */}
      <div className="hidden"></div>

      {/* Date Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pilih Tanggal
          </CardTitle>
          <CardDescription>Masukkan tanggal untuk melihat dan mengelola jadwal Zoom</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Date Input with Calendar Popup */}
          <div className="flex gap-3 items-end">
            {/* Calendar Popup Button */}
            <div className="space-y-2">
              <Label className="opacity-0 pointer-events-none">Pilih</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-10 w-10 group relative"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {selectedDate ? selectedDate.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }) : 'Pilih Tanggal'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={calendarDate}
                    onSelect={(date) => {
                      if (date) {
                        setDateInput({
                          day: date.getDate().toString(),
                          month: (date.getMonth() + 1).toString(),
                          year: date.getFullYear().toString()
                        });
                        handleCalendarDateChange(date);
                        setIsCalendarOpen(false);
                      }
                    }}
                    className="rounded-md"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date Input Fields */}
            <div className="space-y-2 flex-1">
              <Label htmlFor="day">Tanggal</Label>
              <Input
                id="day"
                type="number"
                placeholder={todayDay}
                min="1"
                max="31"
                value={dateInput.day}
                onChange={(e) => setDateInput({ ...dateInput, day: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="month">Bulan</Label>
              <Input
                id="month"
                type="number"
                placeholder={todayMonth}
                min="1"
                max="12"
                value={dateInput.month}
                onChange={(e) => setDateInput({ ...dateInput, month: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="year">Tahun</Label>
              <Input
                id="year"
                type="number"
                placeholder={todayYear}
                min="2024"
                max="2030"
                value={dateInput.year}
                onChange={(e) => setDateInput({ ...dateInput, year: e.target.value })}
                className="h-10"
              />
            </div>
            
            {/* Submit Button */}
            <Button onClick={handleDateSubmit} className="gap-2 h-10 px-4">
              Tampilkan
            </Button>
          </div>
        </CardContent>
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
        <>
          {/* Display Mode Toggle - Outside of Card */}
          <div className="flex items-center justify-between">
            <Tabs value={displayMode} onValueChange={(value) => setDisplayMode(value as 'calendar' | 'list')}>
              <TabsList>
                <TabsTrigger value="calendar" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Kalender
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle>Jadwal Zoom - Admin Control</CardTitle>
                <CardDescription>
                  {viewMode === 'daily' ? (
                    selectedDate.toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  ) : (
                    selectedDate.toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                    })
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* View Mode Selector - Only show in calendar mode */}
                {displayMode === 'calendar' && (
                  <>
                    <Select value={viewMode} onValueChange={(value: 'daily' | 'monthly') => setViewMode(value)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Harian
                          </div>
                        </SelectItem>
                        <SelectItem value="monthly">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Bulanan
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}

                {viewMode === 'daily' && displayMode === 'calendar' && (
                  <>
                    <Button variant="outline" size="sm" onClick={handlePreviousDay}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToday} className="w-[100px]">
                      Hari Ini
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextDay}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {viewMode === 'monthly' && displayMode === 'calendar' && (
                  <>
                    <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleThisMonth} className="w-[100px]">
                      Bulan Ini
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Navigation for List View */}
                {displayMode === 'list' && (
                  <>
                    <Button variant="outline" size="sm" onClick={handlePreviousDay}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToday} className="w-[100px]">
                      Hari Ini
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextDay}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'monthly' ? (
              <ZoomMonthlyCalendar
                tickets={tickets}
                selectedDate={selectedDate}
                onDateChange={onDateChange}
                onBookingClick={setSelectedBooking}
              />
            ) : displayMode === 'list' ? (
              /* List View - All Tickets */
              <div className="space-y-3">
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Tidak ada booking untuk tanggal ini</p>
                  </div>
                ) : (
                  bookings
                    .sort((a, b) => a.data.startTime.localeCompare(b.data.startTime))
                    .map((booking, index) => {
                      const statusStyle = getStatusStyle(booking.status);
                      const StatusIcon = statusStyle.icon;
                      const account = zoomAccounts.find(acc => acc.accountId === booking.data?.zoomAccount);
                      
                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all bg-white"
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Left Side - Booking Info */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 ${statusStyle.bg} rounded-lg flex items-center justify-center`}>
                                  <StatusIcon className={`h-4 w-4 ${statusStyle.text === 'text-gray-900' ? 'text-gray-900' : 'text-white'}`} />
                                </div>
                                <div>
                                  <h4 className="font-semibold">{booking.title}</h4>
                                  <p className="text-sm text-gray-500">{booking.userName}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5 text-gray-700">
                                  <Clock className="h-4 w-4" />
                                  <span>{booking.data.startTime} - {booking.data.endTime}</span>
                                </div>
                                
                                {account && (
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-3 h-3 rounded-full ${account.color}`} />
                                    <span className="text-gray-700">{account.name}</span>
                                    {!account.isActive && (
                                      <Badge variant="secondary" className="text-xs">Nonaktif</Badge>
                                    )}
                                  </div>
                                )}

                                {!account && (
                                  <Badge variant="outline" className="text-xs">
                                    Belum di-assign
                                  </Badge>
                                )}
                              </div>

                              {booking.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">{booking.description}</p>
                              )}
                            </div>

                            {/* Right Side - Status & Actions */}
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                variant={
                                  booking.status === 'approved' 
                                    ? 'default' 
                                    : booking.status === 'ditolak'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {statusStyle.label}
                              </Badge>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedBooking(booking)}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Detail
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                )}
              </div>
            ) : (
              /* Calendar Grid View */
            <ScrollArea className="w-full rounded-md">
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

                  {/* Account Columns - with horizontal scroll if more than 3 accounts */}
                  <ScrollArea className="flex-1 border-l border-gray-300" orientation="horizontal">
                    <div className="flex" style={{ minWidth: zoomAccounts.length > 3 ? `${zoomAccounts.length * 33.333}%` : '100%' }}>
                      {zoomAccounts.slice(0, Math.min(zoomAccounts.length, 999)).map((account, accountIndex) => {
                        const accountBookings = getAccountBookings(account.id);
                        const isAccountActive = account.isActive;
                        
                        return (
                          <div
                            key={account.id}
                            className={`border-r last:border-r-0 border-gray-300 relative ${
                              accountIndex % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'
                            }`}
                            style={{ 
                              minWidth: zoomAccounts.length > 3 ? '400px' : `${100 / Math.min(zoomAccounts.length, 3)}%`,
                              flex: zoomAccounts.length <= 3 ? '1' : 'none'
                            }}
                          >
                            {/* Header Cell */}
                            <div className={`h-12 border-b border-gray-300 flex items-center justify-center px-2 ${
                              isAccountActive ? 'bg-gray-100' : 'bg-gray-200'
                            }`}>
                              <div className="text-center">
                                <span className="text-sm font-medium block">{account.name}</span>
                                <span className={`text-xs ${isAccountActive ? 'text-green-600' : 'text-gray-500'}`}>
                                  {isAccountActive ? '● Aktif' : '● Nonaktif'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Grid Cells Container - Relative positioning for bookings */}
                            <div className="relative" style={{ height: `${totalGridHeight}px` }}>
                              {/* Inactive Overlay */}
                              {!isAccountActive && (
                                <div className="absolute inset-0 bg-gray-100/60 z-20 flex items-center justify-center pointer-events-none">
                                  <div className="text-center">
                                    <PowerOff className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-600 font-semibold">Akun Nonaktif</p>
                                    <p className="text-xs text-gray-500">Tidak menerima booking baru</p>
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
                                const style = getBookingStyle(booking.data.startTime, booking.data.endTime);
                                const statusStyle = getStatusStyle(booking.status);
                                const StatusIcon = statusStyle.icon;
                                
                                return (
                                  <motion.div
                                    key={booking.id}
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`absolute left-2 right-2 ${statusStyle.bg} border-2 ${statusStyle.border} ${statusStyle.text} rounded-lg p-2 shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all z-10 group`}
                                    style={{ 
                                      top: `${style.top}px`, 
                                      height: `${style.height}px`,
                                      minHeight: '60px'
                                    }}
                                    onClick={() => setSelectedBooking(booking)}
                                  >
                                    {/* Status Badge */}
                                    <div className="absolute top-1 right-1">
                                      <StatusIcon className="h-4 w-4" />
                                    </div>

                                    <div className="text-xs font-semibold truncate pr-6">
                                      {booking.title}
                                    </div>
                                    <div className="text-xs opacity-90 flex items-center gap-1 mt-1">
                                      <Clock className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">
                                        {booking.data.startTime} - {booking.data.endTime}
                                      </span>
                                    </div>
                                    {style.height > 60 && (
                                      <>
                                        <div className="text-xs opacity-90 flex items-center gap-1 mt-1">
                                          <User className="h-3 w-3 flex-shrink-0" />
                                          <span className="truncate">{booking.userName}</span>
                                        </div>
                                        <div className="text-xs mt-1 px-1.5 py-0.5 bg-white/20 rounded inline-block">
                                          {statusStyle.label}
                                        </div>
                                      </>
                                    )}
                                    
                                    {/* Hover detail */}
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <div className="text-center">
                                        <Eye className="h-6 w-6 mx-auto mb-1" />
                                        <p className="text-xs">Klik untuk detail</p>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Legend */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold mb-3">Keterangan Status:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm">Disetujui</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-400 rounded flex items-center justify-center">
                        <Clock className="h-4 w-4 text-gray-900" />
                      </div>
                      <span className="text-sm">Pending Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm">Ditolak</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 border-2 border-gray-400 rounded flex items-center justify-center">
                        <PowerOff className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-sm">Akun Nonaktif</span>
                    </div>
                  </div>
                </div>

                {/* Booking Statistics */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Disetujui</p>
                          <p className="text-2xl text-green-600">
                            {bookings.filter(b => b.status === 'approved').length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Pending</p>
                          <p className="text-2xl text-yellow-600">{pendingCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Ditolak</p>
                          <p className="text-2xl text-red-600">
                            {bookings.filter(b => b.status === 'ditolak').length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {bookings.length === 0 && (
                  <div className="mt-6 text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Tidak ada booking untuk tanggal ini</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            )}
          </CardContent>
        </Card>
        </>
      )}

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <ZoomAdminReviewModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onUpdate={() => {
              // Refresh the view by triggering a re-render
              window.dispatchEvent(new Event('localStorageUpdate'));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};