// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DatePicker from '@/components/ui/date-picker';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/storage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  User as UserIcon,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  PowerOff,
  CheckCircle,
  XCircle,
  Eye,
  CalendarDays,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ZoomMonthlyCalendar } from './zoom-monthly-calendar';
import { ZoomAdminReviewModal } from './zoom-admin-review-modal';
import type { Ticket, User } from '@/types';

interface ZoomAdminGridProps {
  tickets: Ticket[];
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
}

// Time slots from 06:00 - 23:00, then 00:00 - 05:00 (24 hours total)
const TIME_HOURS = [
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23, // 6 AM - 11 PM
  0,
  1,
  2,
  3,
  4,
  5, // Midnight - 5 AM
];

// Color mapping for different colors
const COLOR_MAP: Record<
  string,
  {
    color: string;
    lightColor: string;
    borderColor: string;
    hoverColor: string;
    dotColor: string;
  }
> = {
  blue: {
    color: "bg-blue-500",
    lightColor: "bg-blue-100",
    borderColor: "border-blue-300",
    hoverColor: "hover:bg-blue-50",
    dotColor: "bg-blue-600",
  },
  purple: {
    color: "bg-purple-500",
    lightColor: "bg-purple-100",
    borderColor: "border-purple-300",
    hoverColor: "hover:bg-purple-50",
    dotColor: "bg-purple-600",
  },
  green: {
    color: "bg-green-500",
    lightColor: "bg-green-100",
    borderColor: "border-green-300",
    hoverColor: "hover:bg-green-50",
    dotColor: "bg-green-600",
  },
  orange: {
    color: "bg-orange-500",
    lightColor: "bg-orange-100",
    borderColor: "border-orange-300",
    hoverColor: "hover:bg-orange-50",
    dotColor: "bg-orange-600",
  },
  red: {
    color: "bg-red-500",
    lightColor: "bg-red-100",
    borderColor: "border-red-300",
    hoverColor: "hover:bg-red-50",
    dotColor: "bg-red-600",
  },
  teal: {
    color: "bg-teal-500",
    lightColor: "bg-teal-100",
    borderColor: "border-teal-300",
    hoverColor: "hover:bg-teal-50",
    dotColor: "bg-teal-600",
  },
  indigo: {
    color: "bg-indigo-500",
    lightColor: "bg-indigo-100",
    borderColor: "border-indigo-300",
    hoverColor: "hover:bg-indigo-50",
    dotColor: "bg-indigo-600",
  },
  pink: {
    color: "bg-pink-500",
    lightColor: "bg-pink-100",
    borderColor: "border-pink-300",
    hoverColor: "hover:bg-pink-50",
    dotColor: "bg-pink-600",
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

// Local date formatter to ensure consistent date format for API
const formatLocalDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const ZoomAdminGrid: React.FC<ZoomAdminGridProps> = ({
  tickets,
  selectedDate,
  onDateChange,
}) => {
  // View mode state (daily or monthly)
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");

  // Display mode state (calendar or list) - for entire view
  const [displayMode, setDisplayMode] = useState<"calendar" | "list">(
    "calendar"
  );

  // Calendar data from backend
  const [calendarTickets, setCalendarTickets] = useState<any[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Load zoom accounts from backend API - SHOW ALL accounts (both active and inactive)
  const [zoomAccounts, setZoomAccounts] = useState<any[]>(() => {
    // Initial state - will be loaded from API
    return [
      {
        id: 1,
        accountId: "zoom1",
        name: "Akun Zoom 1",
        isActive: true,
        color: "bg-blue-500",
        lightColor: "bg-blue-100",
        borderColor: "border-blue-300",
        hoverColor: "hover:bg-blue-50",
        dotColor: "bg-blue-600",
      },
      {
        id: 2,
        accountId: "zoom2",
        name: "Akun Zoom 2",
        isActive: true,
        color: "bg-purple-500",
        lightColor: "bg-purple-100",
        borderColor: "border-purple-300",
        hoverColor: "hover:bg-purple-50",
        dotColor: "bg-purple-600",
      },
      {
        id: 3,
        accountId: "zoom3",
        name: "Akun Zoom 3",
        isActive: true,
        color: "bg-green-500",
        lightColor: "bg-green-100",
        borderColor: "border-green-300",
        hoverColor: "hover:bg-green-50",
        dotColor: "bg-green-600",
      },
    ];
  });

  // Load zoom accounts from backend API
  useEffect(() => {
    const loadZoomAccounts = async () => {
      try {
        const accounts = await api.get("zoom/accounts");
        if (Array.isArray(accounts)) {
          const mappedAccounts = accounts.map((acc: any) => {
            const colorConfig = COLOR_MAP[acc.color] || COLOR_MAP.blue;
            return {
              id: acc.id,
              accountId: acc.account_id || acc.id,
              name: acc.name,
              isActive: acc.is_active ?? acc.isActive ?? false,
              color: colorConfig.color,
              lightColor: colorConfig.lightColor,
              borderColor: colorConfig.borderColor,
              hoverColor: colorConfig.hoverColor,
              dotColor: colorConfig.dotColor,
            };
          });
          setZoomAccounts(mappedAccounts);
        }
      } catch (err) {
        console.error("Failed to load zoom accounts:", err);
      }
    };

    // Load immediately
    loadZoomAccounts();

    // Refresh every 30 seconds to stay in sync with database
    const interval = setInterval(loadZoomAccounts, 30000);

    return () => clearInterval(interval);
  }, []);

  // Normalize API ticket data to trim time fields, unify dates, and retain account identifiers
  const normalizeTime = (value: string | undefined | null) => {
    if (typeof value !== "string" || value.length === 0) return value;
    const [hour = "00", minute = "00"] = value.split(":");
    return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  };

  const normalizeCalendarTicket = (ticket: any, fallbackDate: string) => {
    const rawDate = ticket.date ?? ticket.startDate ?? fallbackDate;
    let normalizedDate = fallbackDate;

    if (typeof rawDate === "string") {
      const isoCandidate = new Date(rawDate);
      if (!Number.isNaN(isoCandidate.getTime())) {
        normalizedDate = isoCandidate.toISOString().split("T")[0];
      } else {
        normalizedDate = rawDate.split("T")[0] || fallbackDate;
      }
    }

    const zoomAccountId =
      ticket.zoomAccountId ??
      ticket.zoomAccount?.id ??
      ticket.zoom_account_id ??
      null;

    const zoomAccountKey =
      ticket.zoomAccount?.accountId ?? ticket.zoom_account?.account_id ?? null;

    return {
      ...ticket,
      date: normalizedDate,
      startTime: normalizeTime(ticket.startTime ?? ticket.start_time),
      endTime: normalizeTime(ticket.endTime ?? ticket.end_time),
      zoomAccountId: zoomAccountId !== null ? String(zoomAccountId) : null,
      zoomAccountKey,
    };
  };

  const fetchCalendarData = useCallback(async () => {
    if (!selectedDate) return;
    setIsLoadingCalendar(true);
    setCalendarError(null);
    const dateStr = formatLocalDate(selectedDate);
    const monthStr = dateStr.substring(0, 7);
    const params = new URLSearchParams();
    if (viewMode === "daily") {
      params.append("date", dateStr);
      params.append("view", "daily");
    } else {
      params.append("month", monthStr);
      params.append("view", "monthly");
    }
    try {
      const response = await api.get(
        `tickets/calendar/grid?${params.toString()}`
      );
      if (
        response &&
        typeof response === "object" &&
        "success" in response &&
        "data" in response
      ) {
        const { success, data } = response as any;
        if (success && Array.isArray(data)) {
          const normalized = data.map((ticket: any) =>
            normalizeCalendarTicket(ticket, dateStr)
          );
          setCalendarTickets(normalized);
        } else {
          setCalendarTickets([]);
        }
      } else {
        setCalendarTickets([]);
      }
    } catch (err) {
      console.error("Failed to load calendar data:", err);
      setCalendarError("Gagal memuat data kalender");
      setCalendarTickets([]);
    } finally {
      setIsLoadingCalendar(false);
    }
  }, [selectedDate, viewMode]);

  // Load calendar data on mount and when selectedDate or viewMode changes
  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const [selectedBooking, setSelectedBooking] = useState<Ticket | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Get current user and check if admin
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const roles = user.roles || [];
      setIsAdmin(
        roles.includes("admin_layanan") || roles.includes("super_admin")
      );
    }
  }, []);

  // Set default date to today if no date is selected
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date();
      onDateChange(today);
    }
  }, []);

  const handleCalendarDateChange = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
    }
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

  // Navigate to previous month
  const handlePreviousMonth = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  // Navigate to current month
  const handleThisMonth = () => {
    const today = new Date();
    onDateChange(today);
  };

  // Get bookings for selected date
  const getBookingsForDate = () => {
    if (!selectedDate) return [];

    if (viewMode === "daily") {
      const dateStr = formatLocalDate(selectedDate);
      return calendarTickets.filter((ticket) => {
        const ticketDate =
          typeof ticket.date === "string"
            ? ticket.date.split("T")[0]
            : ticket.date;
        return ticketDate === dateStr;
      });
    }
    return calendarTickets;
  };

  const bookings = getBookingsForDate();

  // Calculate booking position and height based on time (vertical layout)
  const getBookingStyle = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

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
      height: heightPx,
    };
  };

  // Get bookings for specific account
  const getAccountBookings = (account: any) => {
    const identifiers = [account.accountId, account.id]
      .filter(Boolean)
      .map((value: any) => String(value));

    return bookings.filter((booking) => {
      const bookingIdentifiers = [
        booking.zoomAccountId,
        booking.zoomAccount?.id,
        booking.zoomAccount?.accountId,
        booking.zoomAccountKey,
      ]
        .filter(Boolean)
        .map((value: any) => String(value));

      if (bookingIdentifiers.length === 0) {
        return identifiers.some((id) => id === "1" || id === "zoom1");
      }

      return bookingIdentifiers.some((id) => identifiers.includes(id));
    });
  };

  const totalGridHeight = TIME_HOURS.length * PIXELS_PER_HOUR;

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved":
        return {
          bg: "bg-green-500",
          border: "border-green-600",
          text: "text-white",
          label: "Disetujui",
          icon: CheckCircle,
        };
      case "menunggu_review":
      case "pending_approval":
      case "pending_review":
        return {
          bg: "bg-yellow-400",
          border: "border-yellow-600",
          text: "text-gray-900",
          label: "Pending",
          icon: Clock,
        };
      case "ditolak":
        return {
          bg: "bg-red-500",
          border: "border-red-600",
          text: "text-white",
          label: "Ditolak",
          icon: XCircle,
        };
      default:
        return {
          bg: "bg-gray-400",
          border: "border-gray-600",
          text: "text-white",
          label: status,
          icon: AlertCircle,
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="hidden"></div>

      {/* Date Input - Responsive Stack */}
      <Card>
        <CardHeader>
          <div className="max-md:flex max-md:flex-col gap-4 md:grid md:grid-cols-2 max-md:items-center mb-4">
            <div>
              <CardTitle className="flex items-start max-md:items-center gap-2">
                <Calendar className="h-5 w-5" />
                Pilih Tanggal
              </CardTitle>
              <CardDescription>
                Pilih tanggal untuk melihat dan mengelola jadwal Zoom
              </CardDescription>
            </div>
            <div className="flex justify-start md:justify-end w-full">
              <div className="w-full md:w-auto">
                <DatePicker
                  value={selectedDate || undefined}
                  onChange={handleCalendarDateChange}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Empty State */}
      {!selectedDate && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-gray-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Silakan pilih tanggal terlebih dahulu</p>
              <p className="text-sm mt-2">
                Gunakan form di atas untuk memilih tanggal yang ingin Anda lihat
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDate && (
        <>
          <Card className="pb-6">
            <CardHeader>
              <div className="max-md:flex max-md:flex-col gap-4 md:grid md:grid-cols-2 md:items-center md:justify-between">
                {/* Title Section */}
                <div className="flex-1">
                  <CardTitle>Jadwal Zoom - Admin Control</CardTitle>
                  {isLoadingCalendar && (
                    <p className="text-sm text-gray-500 mt-1">
                      Memuat data kalender...
                    </p>
                  )}
                  {calendarError && (
                    <p className="text-sm text-red-600 mt-1">{calendarError}</p>
                  )}
                </div>

                {/* Controls Section - Wrap on mobile */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {/* View Mode Selector */}
                  {displayMode === "calendar" && (
                    <Select
                      value={viewMode}
                      onValueChange={(value: "daily" | "monthly") =>
                        setViewMode(value)
                      }
                    >
                      <SelectTrigger className="w-full md:w-[140px] order-1 md:order-none">
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
                  )}

                  {/* Navigation Buttons - Grouped */}
                  <div className="flex items-center gap-2 flex-1 md:flex-none justify-end order-2 md:order-none">
                    {viewMode === "daily" && displayMode === "calendar" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousDay}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToday}
                          className="w-[80px] md:w-[100px]"
                        >
                          Hari Ini
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextDay}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {viewMode === "monthly" && displayMode === "calendar" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousMonth}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleThisMonth}
                          className="w-[80px] md:w-[100px]"
                        >
                          Bulan Ini
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextMonth}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {displayMode === "list" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousDay}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToday}
                          className="w-[80px] md:w-[100px]"
                        >
                          Hari Ini
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextDay}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="max-md:px-2"> {/* Padding reduced on mobile */}
              {viewMode === "monthly" ? (
                <ZoomMonthlyCalendar
                  tickets={calendarTickets}
                  selectedDate={selectedDate}
                />
              ) : displayMode === "list" ? (
                /* List View - Responsive Cards */
                <div className="space-y-3">
                  {bookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">
                        Tidak ada booking untuk tanggal ini
                      </p>
                    </div>
                  ) : (
                    bookings
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((booking, index) => {
                        const statusStyle = getStatusStyle(booking.status);
                        const StatusIcon = statusStyle.icon;
                        const account = zoomAccounts.find((acc) => {
                          const accIds = [acc.id, acc.accountId]
                            .filter(Boolean)
                            .map((value: any) => String(value));
                          const bookingIds = [
                            booking.zoomAccountId,
                            booking.zoomAccount?.id,
                            booking.zoomAccount?.accountId,
                            booking.zoomAccountKey,
                          ]
                            .filter(Boolean)
                            .map((value: any) => String(value));
                          return bookingIds.some((id) => accIds.includes(id));
                        });

                        return (
                          <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all bg-white"
                          >
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                              {/* Left Side - Booking Info */}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`h-8 w-8 shrink-0 ${statusStyle.bg} flex items-center justify-center`}
                                  >
                                    <StatusIcon
                                      className={`h-4 w-4 ${statusStyle.text === "text-gray-900"
                                        ? "text-gray-900"
                                        : "text-white"
                                        }`}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-semibold line-clamp-2">
                                      {booking.title}
                                    </h4>
                                    <p className="text-sm text-gray-500 truncate">
                                      {booking.userName}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                  <div className="flex items-center gap-1.5 text-gray-700">
                                    <Clock className="h-4 w-4 shrink-0" />
                                    <span>
                                      {booking.startTime} - {booking.endTime}
                                    </span>
                                  </div>
                                  {account ? (
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div
                                        className={`w-3 h-3 rounded-full shrink-0 ${account.color}`}
                                      />
                                      <span className="text-gray-700 truncate max-w-[150px]">
                                        {account.name}
                                      </span>
                                      {!account.isActive && (
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] px-1 h-5"
                                        >
                                          Nonaktif
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Belum di-assign
                                    </Badge>
                                  )}
                                </div>

                                {booking.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2 bg-gray-50 p-2">
                                    {booking.description}
                                  </p>
                                )}
                              </div>

                              {/* Right Side - Status & Actions (Responsive) */}
                              <div className="flex flex-row md:flex-col items-center justify-between md:items-end gap-3 pt-3 border-t md:border-t-0 md:pt-0">
                                <Badge
                                  className="w-fit"
                                  variant={
                                    booking.status === "approved"
                                      ? "default"
                                      : booking.status === "ditolak"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {statusStyle.label}
                                </Badge>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedBooking(booking)}
                                  className="gap-2 max-md:flex-1 max-md:justify-center max-md:ml-auto md:w-full"
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
                <div className="!w-full overflow-hidden border">
                  <div className="flex md:!w-full md:gap-0 md:!mr-0 bg-white overflow-x-auto">
                    {/* Time Column - Sticky */}
                    <div className="sticky left-0 z-20 flex-shrink-0 w-16 md:w-24 bg-white border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {/* Header Cell */}
                      <div className="h-12 border-b border-gray-300 flex items-center justify-center bg-gray-50">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                      {/* Time Labels */}
                      {TIME_HOURS.map((hour) => (
                        <div
                          key={hour}
                          className="border-b border-gray-300 relative"
                          style={{ height: `${PIXELS_PER_HOUR}px` }}
                        >
                          {hour !== 6 && (
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs md:text-sm text-gray-700 bg-white px-1 md:px-2 font-medium">
                              {hour.toString().padStart(2, "0")}:00
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Account Columns */}
                    <div
                      className="flex border-l border-gray-300"
                      style={{
                        // On desktop with ≤3 accounts: fill remaining space
                        // Otherwise: use fit-content for horizontal scroll
                        flex: zoomAccounts.length <= 3 ? "1 1 0" : "none",
                        minWidth: zoomAccounts.length <= 3 ? undefined : "fit-content"
                      }}
                    >
                      {zoomAccounts.map((account, accountIndex) => {
                        const accountBookings = getAccountBookings(account);

                        // Width Logic:
                        // ≤3 accounts: flex to fill available space equally
                        // >3 accounts: fixed 320px width for horizontal scroll
                        const shouldUseFlex = zoomAccounts.length <= 3;

                        return (
                          <div
                            key={account.id}
                            className={`border-r last:border-r-0 border-gray-300 relative ${accountIndex % 2 === 0 ? "bg-gray-50/30" : "bg-white"
                              }`}
                            style={{
                              // ≤3 accounts: flex fills space, >3 accounts: fixed width
                              flex: shouldUseFlex ? "1 1 0" : "0 0 320px",
                              minWidth: shouldUseFlex ? "200px" : "320px",
                            }}
                          >
                            {/* Header Cell */}
                            <div
                              className={`h-12 border-b border-gray-300 flex items-center justify-center px-2 ${account.isActive ? "bg-gray-100" : "bg-gray-200"
                                }`}
                            >
                              <div className="text-center w-full">
                                <span className="text-sm font-medium block truncate">
                                  {account.name}
                                </span>
                                <span
                                  className={`text-[10px] md:text-xs ${account.isActive
                                    ? "text-green-600"
                                    : "text-gray-500"
                                    }`}
                                >
                                  {account.isActive ? "● Aktif" : "● Nonaktif"}
                                </span>
                              </div>
                            </div>

                            {/* Grid Cells Container */}
                            <div
                              className="relative"
                              style={{ height: `${totalGridHeight}px` }}
                            >
                              {/* Inactive Overlay */}
                              {!account.isActive && (
                                <div className="absolute inset-0 bg-gray-100/60 z-20 flex items-center justify-center pointer-events-none">
                                  <div className="text-center p-2">
                                    <PowerOff className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 text-gray-400" />
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
                                    height: `${PIXELS_PER_HOUR}px`,
                                  }}
                                />
                              ))}

                              {/* Booking Blocks */}
                              {accountBookings.map((booking, index) => {
                                const style = getBookingStyle(
                                  booking.startTime,
                                  booking.endTime
                                );
                                const statusStyle = getStatusStyle(booking.status);
                                const StatusIcon = statusStyle.icon;

                                return (
                                  <motion.div
                                    key={booking.id}
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`absolute left-1 right-1 md:left-2 md:right-2 ${statusStyle.bg} border-2 ${statusStyle.border} ${statusStyle.text} p-1.5 md:p-2 shadow-sm md:shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all z-10 group`}
                                    style={{
                                      top: `${style.top}px`,
                                      height: `${style.height}px`,
                                      minHeight: "50px",
                                    }}
                                    onClick={() => setSelectedBooking(booking)}
                                  >
                                    {/* Icon Only on Mobile, Absolute Position */}
                                    <div className="absolute top-1 right-1">
                                      <StatusIcon className="h-3 w-3 md:h-4 md:w-4" />
                                    </div>

                                    <div className="text-xs md:text-xs font-semibold truncate pr-4 md:pr-6">
                                      {booking.title}
                                    </div>
                                    <div className="text-md md:text-xs opacity-90 flex items-center gap-1 mt-0.5 md:mt-1">
                                      <Clock className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                                      <span className="truncate">
                                        {booking.startTime} - {booking.endTime}
                                      </span>
                                    </div>

                                    {/* Detail tambahan jika blok cukup tinggi */}
                                    {style.height > 60 && (
                                      <div className="hidden md:block">
                                        <div className="text-xs opacity-90 flex items-center gap-1 mt-1">
                                          <UserIcon className="h-3 w-3 flex-shrink-0" />
                                          <span className="truncate">
                                            {booking.userName}
                                          </span>
                                        </div>
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
                  <div className="mt-0 p-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm font-semibold mb-3">
                      Keterangan Status:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded flex items-center justify-center shrink-0">
                          <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-white" />
                        </div>
                        <span className="text-xs md:text-sm">Disetujui</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-yellow-400 rounded flex items-center justify-center shrink-0">
                          <Clock className="h-3 w-3 md:h-4 md:w-4 text-gray-900" />
                        </div>
                        <span className="text-xs md:text-sm">Pending Review</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-red-500 rounded flex items-center justify-center shrink-0">
                          <XCircle className="h-3 w-3 md:h-4 md:w-4 text-white" />
                        </div>
                        <span className="text-xs md:text-sm">Ditolak</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-200 border-2 border-gray-400 rounded flex items-center justify-center shrink-0">
                          <PowerOff className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
                        </div>
                        <span className="text-xs md:text-sm">Akun Nonaktif</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {selectedBooking && isAdmin && (
        <ZoomAdminReviewModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdate={() => {
            fetchCalendarData();
          }}
        />
      )}

      {selectedBooking && !isAdmin && currentUser && (
        <DetailDialog
          open={true}
          onOpenChange={(open) => !open && setSelectedBooking(null)}
          booking={selectedBooking}
          isManagement={false}
          renderStatusBadge={(status) => {
            const statusMap: Record<
              string,
              {
                label: string;
                variant: "default" | "secondary" | "destructive" | "outline";
              }
            > = {
              pending_review: {
                label: "Menunggu Review",
                variant: "secondary",
              },
              approved: { label: "Disetujui", variant: "default" },
              rejected: { label: "Ditolak", variant: "destructive" },
            };
            const config = statusMap[status] || {
              label: status,
              variant: "outline",
            };
            return <Badge variant={config.variant}>{config.label}</Badge>;
          }}
          zoomAccountDisplay={{} as any}
          onRequestApprove={() => { }}
          onRequestReject={() => { }}
          onClose={() => setSelectedBooking(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
