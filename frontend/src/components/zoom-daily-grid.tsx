import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar, Clock, User, AlertCircle, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { Ticket } from '../types';

interface ZoomDailyGridProps {
  tickets: Ticket[];
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
}

// Time slots from 06:00 - 23:00, then 00:00 - 05:00 (24 hours total)
const TIME_HOURS = [
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, // 6 AM - 11 PM
  0, 1, 2, 3, 4, 5 // Midnight - 5 AM
];

const ZOOM_ACCOUNTS = [
  { id: 1, name: 'Akun Zoom 1', color: 'bg-blue-500', lightColor: 'bg-blue-100', borderColor: 'border-blue-300' },
  { id: 2, name: 'Akun Zoom 2', color: 'bg-purple-500', lightColor: 'bg-purple-100', borderColor: 'border-purple-300' },
  { id: 3, name: 'Akun Zoom 3', color: 'bg-green-500', lightColor: 'bg-green-100', borderColor: 'border-green-300' },
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
}) => {
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

  // Get bookings for selected date
  const getBookingsForDate = () => {
    if (!selectedDate) return [];

    const dateStr = selectedDate.toISOString().split('T')[0];
    
    return tickets.filter(t => {
      if (t.status !== 'approved' && t.status !== 'menunggu_review' && t.status !== 'pending_approval') {
        return false;
      }
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

  return (
    <div className="space-y-4">
      {/* Date Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pilih Tanggal
          </CardTitle>
          <CardDescription>Masukkan tanggal untuk melihat ketersediaan slot Zoom</CardDescription>
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle>Ketersediaan Zoom</CardTitle>
                <CardDescription>
                  {selectedDate.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </CardDescription>
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

                  {/* Account Columns */}
                  <div className="flex-1 flex border-l border-gray-300">
                    {ZOOM_ACCOUNTS.map((account, accountIndex) => {
                      const accountBookings = getAccountBookings(account.id);
                      
                      return (
                        <div
                          key={account.id}
                          className={`flex-1 border-r last:border-r-0 border-gray-300 ${accountIndex % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}`}
                        >
                          {/* Header Cell */}
                          <div className="h-12 bg-gray-100 border-b border-gray-300 flex items-center justify-center px-2">
                            <span className="text-sm font-medium text-center">{account.name}</span>
                          </div>
                          
                          {/* Grid Cells Container - Relative positioning for bookings */}
                          <div className="relative" style={{ height: `${totalGridHeight}px` }}>
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
                              const isPending = booking.status === 'menunggu_review' || booking.status === 'pending_approval';
                              
                              return (
                                <motion.div
                                  key={booking.id}
                                  initial={{ scale: 0.95, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                  className={`absolute left-2 right-2 ${
                                    isPending 
                                      ? 'bg-yellow-400 border border-yellow-600' 
                                      : `${account.color} border ${account.borderColor}`
                                  } text-white rounded-lg p-2 shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow z-10`}
                                  style={{ 
                                    top: `${style.top}px`, 
                                    height: `${style.height}px`,
                                    minHeight: '40px'
                                  }}
                                >
                                  <div className="text-xs font-semibold truncate flex items-center gap-1">
                                    <span className="flex-1 truncate">{booking.title}</span>
                                    <ChevronDown className="h-3 w-3 flex-shrink-0" />
                                  </div>
                                  <div className="text-xs opacity-90 flex items-center gap-1 mt-0.5">
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {booking.data.startTime} - {booking.data.endTime}
                                    </span>
                                  </div>
                                  {style.height > 60 && (
                                    <div className="text-xs opacity-90 flex items-center gap-1 mt-0.5">
                                      <User className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{booking.userName}</span>
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
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold mb-3">Keterangan:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded" />
                      <span className="text-sm">Area Kosong</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded" />
                      <span className="text-sm">Akun Zoom 1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-500 rounded" />
                      <span className="text-sm">Akun Zoom 2</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 rounded" />
                      <span className="text-sm">Akun Zoom 3</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-400 rounded" />
                      <span className="text-sm">Booking Pending</span>
                    </div>
                  </div>
                </div>

                {/* Booking List */}
                {bookings.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="text-sm font-semibold">Detail Booking Hari Ini:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {bookings.map((booking, index) => {
                        const accountConfig = ZOOM_ACCOUNTS.find(a => {
                          if (booking.data?.zoomAccount === `zoom${a.id}`) return true;
                          return false;
                        });
                        const accountName = booking.data?.zoomAccount 
                          ? `Akun Zoom ${booking.data.zoomAccount.replace('zoom', '')}`
                          : 'Pending Assignment';

                        return (
                          <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card className="overflow-hidden">
                              <div className={`h-1 ${accountConfig?.color || 'bg-yellow-500'}`} />
                              <CardContent className="p-3">
                                <div className="space-y-2">
                                  <p className="font-semibold text-sm">{booking.title}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Clock className="h-3 w-3" />
                                    {booking.data?.startTime} - {booking.data?.endTime}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <User className="h-3 w-3" />
                                    {booking.userName}
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    <Badge variant={booking.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                                      {accountName}
                                    </Badge>
                                    <Badge 
                                      variant={
                                        booking.status === 'approved' 
                                          ? 'default' 
                                          : booking.status === 'menunggu_review' || booking.status === 'pending_approval'
                                          ? 'secondary'
                                          : 'destructive'
                                      }
                                      className="text-xs"
                                    >
                                      {booking.status === 'approved' 
                                        ? 'Disetujui' 
                                        : booking.status === 'menunggu_review' || booking.status === 'pending_approval'
                                        ? 'Pending'
                                        : 'Ditolak'}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {bookings.length === 0 && (
                  <div className="mt-6 text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Tidak ada booking untuk tanggal ini</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};