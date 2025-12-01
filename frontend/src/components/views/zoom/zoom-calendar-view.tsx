// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { motion } from 'motion/react';
import type { User } from '@/types';

interface ZoomCalendarViewProps {
  currentUser: User;
}

// 3 Zoom Pro Accounts - Match dengan database ID
const ZOOM_ACCOUNTS = [
  { id: "1", name: "Akun Zoom 1", color: "#3b82f6" }, // blue
  { id: "2", name: "Akun Zoom 2", color: "#8b5cf6" }, // purple
  { id: "3", name: "Akun Zoom 3", color: "#10b981" }, // green
];

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];


const SHORT_DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export const ZoomCalendarView: React.FC<ZoomCalendarViewProps> = ({
  currentUser,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "today">("month");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [tickets, setTickets] = useState<any[]>([]);

  // Fetch zoom tickets from API
  useEffect(() => {
    (async () => {
      const allTickets = await loadAllZoomMeetingTickets();
      setTickets(allTickets);
    })();
  }, []);

  // Filter zoom tickets
  const zoomTickets = useMemo(() => {
    return tickets.filter(
      (t) =>
        t.type === "zoom_meeting" &&
        (t.status === "approved" ||
          t.status === "pending_review" ||
          t.status === "pending_approval")
    );
  }, [tickets]);

  // Assign zoom accounts to bookings based on zoomAccountId from database
  const bookingsWithAccounts = useMemo(() => {
    return zoomTickets.map((ticket) => {
      // Gunakan zoomAccountId dari database, atau fallback ke zoom1
      const accountId =
        ticket.zoomAccountId || ticket.zoom_account_id || "zoom1";
      const zoomAccount =
        ZOOM_ACCOUNTS.find((acc) => String(acc.id) === String(accountId)) ||
        ZOOM_ACCOUNTS[0];

      return {
        ...ticket,
        zoomAccount,
      };
    });
  }, [zoomTickets]);

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    let filteredBookings = bookingsWithAccounts.filter(
      (b) => b.date === dateStr
    );

    if (selectedAccount !== "all") {
      filteredBookings = filteredBookings.filter(
        (b) => b.zoomAccount.id === selectedAccount
      );
    }

    return filteredBookings;
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setViewMode("today");
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get today's bookings
  const todayBookings = useMemo(() => {
    const today = new Date();
    return getBookingsForDate(today);
  }, [bookingsWithAccounts, selectedAccount]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-[200px] text-center">
                <h3 className="font-semibold">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
              </div>

              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "today" ? "default" : "outline"}
                onClick={goToToday}
              >
                Hari Ini
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                onClick={() => setViewMode("month")}
              >
                Bulanan
              </Button>
            </div>

            {/* Account Filter */}
            <div className="min-w-[180px]">
              <Select
                value={selectedAccount}
                onValueChange={setSelectedAccount}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Akun</SelectItem>
                  {ZOOM_ACCOUNTS.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: account.color }}
                        />
                        {account.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {viewMode === "month" ? (
        <Card>
          <CardContent className="p-6">
            {/* Calendar Grid */}
            <div className="space-y-2">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {SHORT_DAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-gray-600 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarData.map((day, index) => {
                  const bookings = getBookingsForDate(day.date);
                  const isCurrentDay = isToday(day.date);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.01 }}
                      className={`min-h-[120px] border rounded-lg p-2 ${
                        day.isCurrentMonth ? "bg-white" : "bg-gray-50"
                      } ${
                        isCurrentDay
                          ? "border-blue-500 border-2 bg-blue-50"
                          : ""
                      }`}
                    >
                      {/* Date Number */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm ${
                            day.isCurrentMonth ? "font-medium" : "text-gray-400"
                          } ${isCurrentDay ? "text-blue-600 font-bold" : ""}`}
                        >
                          {day.date.getDate()}
                        </span>
                        {bookings.length > 0 && (
                          <Badge variant="secondary" className="text-xs h-5">
                            {bookings.length}
                          </Badge>
                        )}
                      </div>

                      {/* Bookings */}
                      <div className="space-y-1">
                        {bookings.slice(0, 3).map((booking) => (
                          <div
                            key={booking.id}
                            className="text-xs p-1.5 rounded truncate"
                            style={{
                              backgroundColor: `${booking.zoomAccount.color}15`,
                              borderLeft: `3px solid ${booking.zoomAccount.color}`,
                            }}
                            title={`${booking.startTime} - ${booking.title}`}
                          >
                            <div className="font-medium truncate">
                              {booking.startTime} {booking.title}
                            </div>
                          </div>
                        ))}
                        {bookings.length > 3 && (
                          <div className="text-xs text-gray-500 pl-1">
                            +{bookings.length - 3} lainnya
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-semibold mb-3">
                Keterangan Akun Zoom:
              </h4>
              <div className="flex flex-wrap gap-4">
                {ZOOM_ACCOUNTS.map((account) => (
                  <div key={account.id} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: account.color }}
                    />
                    <span className="text-sm">{account.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Today View */
        <Card>
          <CardHeader>
            <CardTitle>Jadwal Hari Ini</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Video className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Tidak ada booking hari ini</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayBookings
                  .sort((a, b) =>
                    (a.startTime || "").localeCompare(b.startTime || "")
                  )
                  .map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50"
                    >
                      {/* Time */}
                      <div className="min-w-[80px] text-center">
                        <div className="font-semibold">{booking.startTime}</div>
                        <div className="text-xs text-gray-500">
                          {booking.data?.endTime}
                        </div>
                      </div>

                      {/* Account Indicator */}
                      <div
                        className="w-1 h-full rounded-full"
                        style={{ backgroundColor: booking.zoomAccount.color }}
                      />

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{booking.title}</h4>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: booking.zoomAccount.color,
                              color: booking.zoomAccount.color,
                            }}
                          >
                            {booking.zoomAccount.name}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Pemohon: {booking.userName}</p>
                          <p>Unit: {booking.unitKerja}</p>
                          <p>
                            Peserta: {booking.data?.estimatedParticipants} orang
                          </p>
                          {booking.status === "approved" &&
                            booking.data?.meetingId && (
                              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                <p className="text-xs font-mono">
                                  Meeting ID: {booking.data.meetingId}
                                </p>
                                <p className="text-xs font-mono">
                                  Passcode: {booking.data.passcode}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <Badge
                          variant={
                            booking.status === "approved"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {booking.status === "approved"
                            ? "Disetujui"
                            : "Pending"}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
