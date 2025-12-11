import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, RotateCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getTickets,
  refreshTicketsFromApi,
  loadAllZoomMeetingTickets,
  addNotification,
  saveTickets,
} from '@/lib/storage';
import { api } from '@/lib/api';
import type { User } from '@/types';
import type { ViewType } from '@/components/main-layout';
import { ZoomBookingUserTabs } from './zoom-booking-user-tabs';
import { ZoomBookingManagementTabs } from './zoom-booking-management-tabs';
import { QuickBookingDialog, DetailDialog, ApproveDialog, RejectDialog } from './zoom-booking-dialogs/index';
import type {
  BookingGroups,
  ZoomAccountDisplay,
  ZoomAccountUi,
  QuickBookingFormState,
  ApprovalFormState,
} from "./zoom-booking-types";

interface ZoomBookingProps {
  currentUser: User;
  isManagement: boolean;
  onNavigate: (view: ViewType) => void;
  onViewTicket?: (ticketId: string) => void;
}

const ACCOUNT_COLOR_MAP: Record<
  string,
  { color: string; lightColor: string; borderColor: string; dotColor: string }
> = {
  blue: {
    color: "bg-blue-500",
    lightColor: "bg-blue-100",
    borderColor: "border-blue-300",
    dotColor: "bg-blue-600",
  },
  purple: {
    color: "bg-purple-500",
    lightColor: "bg-purple-100",
    borderColor: "border-purple-300",
    dotColor: "bg-purple-600",
  },
  green: {
    color: "bg-green-500",
    lightColor: "bg-green-100",
    borderColor: "border-green-300",
    dotColor: "bg-green-600",
  },
  orange: {
    color: "bg-orange-500",
    lightColor: "bg-orange-100",
    borderColor: "border-orange-300",
    dotColor: "bg-orange-600",
  },
  red: {
    color: "bg-red-500",
    lightColor: "bg-red-100",
    borderColor: "border-red-300",
    dotColor: "bg-red-600",
  },
  teal: {
    color: "bg-teal-500",
    lightColor: "bg-teal-100",
    borderColor: "border-teal-300",
    dotColor: "bg-teal-600",
  },
  indigo: {
    color: "bg-indigo-500",
    lightColor: "bg-indigo-100",
    borderColor: "border-indigo-300",
    dotColor: "bg-indigo-600",
  },
  pink: {
    color: "bg-pink-500",
    lightColor: "bg-pink-100",
    borderColor: "border-pink-300",
    dotColor: "bg-pink-600",
  },
};

const INITIAL_BOOKING_FORM: QuickBookingFormState = {
  title: "",
  purpose: "",
  participants: "",
  breakoutRooms: "0",
  startTime: "",
  endTime: "",
};

const INITIAL_APPROVAL_FORM: ApprovalFormState = {
  meetingLink: "",
  passcode: "",
  zoomAccount: "",
};

const resolveZoomAccountDisplay = (booking: any): ZoomAccountDisplay => {
  const fallback: ZoomAccountDisplay = { name: "-", hostKey: "-" };
  if (!booking) return fallback;

  const candidates = [
    booking.zoomAccount,
    booking.zoom_account,
    booking.zoomAccountId,
    booking.zoom_account_id,
    booking.zoomAccountKey,
  ].filter(Boolean);

  const fromValue = (value: any): ZoomAccountDisplay => {
    if (!value) return fallback;

    if (typeof value === "string" || typeof value === "number") {
      return {
        name: String(value),
        hostKey: "-",
      };
    }

    if (typeof value === "object") {
      return {
        name: value.name ?? "-",
        hostKey: value.hostKey ?? value.host_key ?? "-",
      };
    }

    return fallback;
  };

  for (const candidate of candidates) {
    const resolved = fromValue(candidate);
    if (resolved.name !== "-" || resolved.hostKey !== "-") {
      return resolved;
    }
  }

  return fallback;
};

const formatLocalDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeTime = (value: string | undefined | null) => {
  if (typeof value !== "string" || value.length === 0) return value;
  const [hour = "00", minute = "00"] = value.split(":");
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const normalizeCalendarTicket = (ticket: any, fallbackDate: string) => {
  const rawDate = ticket.date ?? ticket.zoom_date ?? fallbackDate;
  let normalizedDate = fallbackDate;

  if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    normalizedDate = rawDate;
  }

  const zoomAccountId =
    ticket.zoomAccountId ?? ticket.zoom_account_id ?? ticket.zoom_account;
  const zoomAccountKey = ticket.zoomAccountKey ?? ticket.zoom_account_key;

  return {
    ...ticket,
    type: ticket.type ?? "zoom_meeting",
    date: normalizedDate,
    startTime: normalizeTime(ticket.startTime ?? ticket.start_time),
    endTime: normalizeTime(ticket.endTime ?? ticket.end_time),
    status: ticket.status ?? "pending_review",
    zoomAccountId: zoomAccountId !== null ? String(zoomAccountId) : null,
    zoomAccountKey,
  };
};

export const ZoomBooking: React.FC<ZoomBookingProps> = ({
  currentUser,
  isManagement,
  onViewTicket,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalForm, setApprovalForm] = useState<ApprovalFormState>({
    ...INITIAL_APPROVAL_FORM,
  });
  const [rejectionReason, setRejectionReason] = useState("");

  const [showQuickBookingDialog, setShowQuickBookingDialog] = useState(false);
  const [quickBookingDate, setQuickBookingDate] = useState<Date | undefined>(
    undefined
  );
  const [bookingForm, setBookingForm] = useState<QuickBookingFormState>({
    ...INITIAL_BOOKING_FORM,
  });
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedCoHostIds, setSelectedCoHostIds] = useState<string[]>([]);
  const [coHostQuery, setCoHostQuery] = useState("");
  const [isSearchingCoHost, setIsSearchingCoHost] = useState(false);
  const [coHostResults, setCoHostResults] = useState<User[]>([]);

  const [dailyTickets, setDailyTickets] = useState<any[]>([]);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [dailyError, setDailyError] = useState<string | null>(null);

  const tickets = getTickets();
  const [zoomTickets, setZoomTickets] = useState<any[]>([]);
  const [zoomAccounts, setZoomAccounts] = useState<ZoomAccountUi[]>([]);

  const mergeUsers = useCallback((users: User[]) => {
    setAvailableUsers((prev) => {
      const map = new Map(prev.map((u) => [String(u.id), u] as const));
      for (const user of users) {
        map.set(String(user.id), user);
      }
      return Array.from(map.values());
    });
  }, []);

  const searchCoHosts = useCallback(async () => {
    if (coHostQuery.trim().length < 4) return;
    setIsSearchingCoHost(true);
    try {
      const response: any = await api
        .get(`users?search=${encodeURIComponent(coHostQuery)}`)
        .catch(() => null);
      const raw = Array.isArray(response) ? response : response?.data || [];
      const normalized: User[] = raw.map((record: any) => ({
        id: String(record.id ?? ""),
        email: String(record.email ?? ""),
        name: String(record.name ?? ""),
        nip: String(record.nip ?? ""),
        jabatan: String(record.jabatan ?? ""),
        role: (Array.isArray(record.roles)
          ? record.roles[0] ?? "pegawai"
          : record.role ?? "pegawai") as any,
        roles: (Array.isArray(record.roles)
          ? record.roles
          : record.role
            ? [record.role]
            : ["pegawai"]) as any,
        unitKerja: String(record.unitKerja ?? record.unit_kerja ?? ""),
        phone: String(record.phone ?? ""),
        avatar: record.avatar ?? undefined,
        createdAt: String(
          record.createdAt ?? record.created_at ?? new Date().toISOString()
        ),
        isActive: Boolean(record.isActive ?? record.is_active ?? true),
        failedLoginAttempts: Number(
          record.failedLoginAttempts ?? record.failed_login_attempts ?? 0
        ),
        lockedUntil: record.lockedUntil ?? record.locked_until ?? undefined,
      }));
      const pegawaiOnly = normalized.filter(
        (user) => (user.roles || []).includes("pegawai") && user.email
      );
      setCoHostResults(pegawaiOnly);
      mergeUsers(pegawaiOnly);
    } finally {
      setIsSearchingCoHost(false);
    }
  }, [coHostQuery, mergeUsers]);

  const fetchDailyTickets = useCallback(
    async (targetDate?: Date | null) => {
      const dateToUse = targetDate ?? selectedDate;
      if (!dateToUse) {
        setDailyTickets([]);
        return;
      }

      setIsLoadingDaily(true);
      setDailyError(null);

      const dateStr = formatLocalDate(dateToUse);
      const params = new URLSearchParams({ date: dateStr, view: "daily" });

      try {
        const response: any = await api
          .get(`tickets/calendar/grid?${params.toString()}`)
          .catch(() => null);

        if (response && Array.isArray(response.data)) {
          const normalized = response.data.map((ticket: any) =>
            normalizeCalendarTicket(ticket, dateStr)
          );
          setDailyTickets(normalized);
        } else if (Array.isArray(response)) {
          const normalized = response.map((ticket: any) =>
            normalizeCalendarTicket(ticket, dateStr)
          );
          setDailyTickets(normalized);
        } else {
          setDailyTickets([]);
        }
      } catch (err) {
        console.error("Failed to load daily zoom tickets:", err);
        setDailyError("Gagal memuat data ketersediaan Zoom");
        setDailyTickets([]);
      } finally {
        setIsLoadingDaily(false);
      }
    },
    [selectedDate]
  );

  const handleRefreshZoomData = useCallback(async () => {
    const all = await loadAllZoomMeetingTickets();
    setZoomTickets(all);
    await refreshTicketsFromApi();
    await fetchDailyTickets(selectedDate ?? new Date());
  }, [fetchDailyTickets, selectedDate]);

  useEffect(() => {
    (async () => {
      const all = await loadAllZoomMeetingTickets();
      setZoomTickets(all);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const accounts: any = await api.get("zoom/accounts").catch(() => []);
        if (Array.isArray(accounts)) {
          const mapped: ZoomAccountUi[] = accounts.map((acc: any) => {
            const colorCfg =
              ACCOUNT_COLOR_MAP[acc.color] ?? ACCOUNT_COLOR_MAP.blue;
            return {
              id: acc.id,
              accountId: acc.account_id ?? acc.accountId ?? acc.id,
              name: acc.name,
              isActive: acc.is_active ?? acc.isActive ?? false,
              color: colorCfg.color,
              lightColor: colorCfg.lightColor,
              borderColor: colorCfg.borderColor,
              dotColor: colorCfg.dotColor,
            };
          });
          setZoomAccounts(mapped);
        } else {
          setZoomAccounts([]);
        }
      } catch (err) {
        console.error("Failed to load zoom accounts:", err);
        setZoomAccounts([]);
      }
    })();
  }, []);

  useEffect(() => {
    fetchDailyTickets(selectedDate ?? null);
  }, [selectedDate, fetchDailyTickets]);

  const myBookings = useMemo(() => {
    if (isManagement) return zoomTickets;
    return zoomTickets.filter(
      (ticket) => String(ticket.userId) === String(currentUser.id)
    );
  }, [isManagement, zoomTickets, currentUser.id]);

  const bookingGroups = useMemo<BookingGroups>(() => {
    const sortByNewest = (ticketsToSort: any[]) =>
      [...ticketsToSort].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return {
      all: sortByNewest(myBookings),
      pending: sortByNewest(
        myBookings.filter((ticket) => ticket.status === "pending_review")
      ),
      approved: sortByNewest(
        myBookings.filter((ticket) => ticket.status === "approved")
      ),
      rejected: sortByNewest(
        myBookings.filter((ticket) => ticket.status === "rejected")
      ),
    };
  }, [myBookings]);

  const renderStatusBadge = useCallback((status: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> =
    {
      pending_review: {
        label: "Pending Review",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      approved: {
        label: "Approved",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      rejected: {
        label: "Rejected",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
      },
      cancelled: {
        label: "Cancelled",
        color: "bg-gray-100 text-gray-800",
        icon: XCircle,
      },
      completed: {
        label: "Completed",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
    };

    const statusConfig = config[status] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
      icon: Clock,
    };
    const Icon = statusConfig.icon;

    return (
      <Badge className={`${statusConfig.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  }, []);

  const handleDailyGridDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleSelectBooking = useCallback((booking: any) => {
    setSelectedBooking(booking);
    setShowDetailDialog(true);
  }, []);

  const handleViewTicketById = useCallback(
    (ticketId: string) => {
      const ticket = zoomTickets.find(
        (item) => String(item.id) === String(ticketId)
      );
      if (ticket) {
        setSelectedBooking(ticket);
        setShowDetailDialog(true);
      }
    },
    [zoomTickets]
  );

  const handleBookingFormChange = useCallback(
    (changes: Partial<QuickBookingFormState>) => {
      setBookingForm((prev) => ({ ...prev, ...changes }));
    },
    []
  );

  const handleApprovalFormChange = useCallback(
    (changes: Partial<ApprovalFormState>) => {
      setApprovalForm((prev) => ({ ...prev, ...changes }));
    },
    []
  );

  const handleCoHostSelect = useCallback((id: string) => {
    setSelectedCoHostIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const handleCoHostRemove = useCallback((id: string) => {
    setSelectedCoHostIds((prev) => prev.filter((existing) => existing !== id));
  }, []);

  const resetQuickBookingState = useCallback(() => {
    setQuickBookingDate(undefined);
    setBookingForm({ ...INITIAL_BOOKING_FORM });
    setSelectedCoHostIds([]);
    setCoHostQuery("");
    setCoHostResults([]);
    setAttachments([]);
    setIsSubmittingQuick(false);
  }, []);

  const handleQuickDialogOpenChange = useCallback(
    (open: boolean) => {
      setShowQuickBookingDialog(open);
      if (!open) {
        resetQuickBookingState();
      }
    },
    [resetQuickBookingState]
  );

  const handleQuickDialogCancel = useCallback(() => {
    resetQuickBookingState();
    setShowQuickBookingDialog(false);
  }, [resetQuickBookingState]);

  const handleDetailDialogOpenChange = useCallback((open: boolean) => {
    setShowDetailDialog(open);
    if (!open) {
      setSelectedBooking(null);
    }
  }, []);

  const handleApproveDialogOpenChange = useCallback((open: boolean) => {
    setShowApproveDialog(open);
    if (!open) {
      setApprovalForm({ ...INITIAL_APPROVAL_FORM });
    }
  }, []);

  const handleApproveCancel = useCallback(() => {
    setApprovalForm({ ...INITIAL_APPROVAL_FORM });
    setShowApproveDialog(false);
  }, []);

  const handleRejectDialogOpenChange = useCallback((open: boolean) => {
    setShowRejectDialog(open);
    if (!open) {
      setRejectionReason("");
    }
  }, []);

  const handleRejectCancel = useCallback(() => {
    setRejectionReason("");
    setShowRejectDialog(false);
  }, []);

  const handleSubmitQuickBooking = useCallback(async () => {
    if (!quickBookingDate) {
      toast.error("Tanggal meeting harus dipilih");
      return;
    }

    if (!bookingForm.title.trim()) {
      toast.error("Judul meeting harus diisi");
      return;
    }
    if (!bookingForm.purpose.trim()) {
      toast.error("Deskripsi peminjaman zoom harus diisi");
      return;
    }
    if (!bookingForm.startTime) {
      toast.error("Waktu mulai harus diisi");
      return;
    }
    if (!bookingForm.endTime) {
      toast.error("Waktu selesai harus diisi");
      return;
    }
    if (
      !bookingForm.participants.trim() ||
      parseInt(bookingForm.participants, 10) <= 0
    ) {
      toast.error("Jumlah peserta harus diisi dengan benar");
      return;
    }

    const [startHour, startMin] = bookingForm.startTime.split(":").map(Number);
    const [endHour, endMin] = bookingForm.endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      toast.error("Waktu selesai harus lebih besar dari waktu mulai");
      return;
    }

    // Hitung durasi dalam menit
    const durationInMinutes = endMinutes - startMinutes;

    // Validasi waktu tidak boleh kurang dari waktu sekarang (Waktu Indonesia Tengah - WIT UTC+8)
    const now = new Date();
    const witOffset = 8 * 60; // WIT adalah UTC+8 dalam menit
    const localOffset = now.getTimezoneOffset(); // offset lokal dalam menit (negatif untuk timezones di timur UTC)
    const witTime = new Date(
      now.getTime() + (witOffset + localOffset) * 60 * 1000
    );

    const selectedDateTime = new Date(quickBookingDate);
    selectedDateTime.setHours(startHour, startMin, 0, 0);

    // Bandingkan dengan waktu WIT
    if (selectedDateTime <= witTime) {
      toast.error(
        "Waktu booking tidak boleh kurang dari waktu sekarang (Waktu Indonesia Tengah - NTB)"
      );
      return;
    }

    const yyyy = quickBookingDate.getFullYear();
    const mm = String(quickBookingDate.getMonth() + 1).padStart(2, "0");
    const dd = String(quickBookingDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const hosts = selectedCoHostIds
      .map((id) =>
        availableUsers.find((user) => String(user.id) === String(id))
      )
      .filter((user): user is User => Boolean(user && user.email))
      .map((user) => ({ name: user.name, email: user.email }));

    // Use FormData untuk support file upload
    const formData = new FormData();
    formData.append("type", "zoom_meeting");
    formData.append("title", bookingForm.title);
    formData.append("description", bookingForm.purpose);
    formData.append("zoom_date", dateStr);
    formData.append("zoom_start_time", bookingForm.startTime);
    formData.append("zoom_end_time", bookingForm.endTime);
    formData.append("zoom_duration", String(durationInMinutes));
    formData.append(
      "zoom_estimated_participants",
      bookingForm.participants || "0"
    );
    formData.append("zoom_breakout_rooms", bookingForm.breakoutRooms || "0");

    if (hosts.length > 0) {
      formData.append("zoom_co_hosts", JSON.stringify(hosts));
    }

    // Append file attachments
    attachments.forEach((file, index) => {
      formData.append(`zoom_attachments[${index}]`, file);
    });

    try {
      setIsSubmittingQuick(true);
      const response = await fetch(
        `${import.meta.env.VITE_API || "http://localhost:8000/api"
        }/tickets`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengajukan booking");
      }

      await handleRefreshZoomData();
      toast.success("Booking berhasil diajukan!");
      resetQuickBookingState();
      setShowQuickBookingDialog(false);
    } catch (err: any) {
      const message = err?.message || "Gagal mengajukan booking";
      toast.error(String(message));
    } finally {
      setIsSubmittingQuick(false);
    }
  }, [
    availableUsers,
    attachments,
    bookingForm,
    handleRefreshZoomData,
    quickBookingDate,
    resetQuickBookingState,
    selectedCoHostIds,
  ]);

  const handleApproveBooking = useCallback(
    async (ticketId: string) => {
      if (!approvalForm.meetingLink.trim()) {
        toast.error("Link Meeting harus diisi");
        return;
      }
      if (!approvalForm.passcode.trim()) {
        toast.error("Passcode harus diisi");
        return;
      }
      if (!approvalForm.zoomAccount.trim()) {
        toast.error("Akun Zoom harus dipilih");
        return;
      }

      const linkParts = approvalForm.meetingLink.match(/\/j\/(\d+)/);
      const meetingId = linkParts ? linkParts[1] : "N/A";

      const updatedTickets = tickets.map((ticket) => {
        if (ticket.id === ticketId && ticket.type === "zoom_meeting") {
          return {
            ...ticket,
            status: "approved" as const,
            meetingId,
            passcode: approvalForm.passcode,
            meetingLink: approvalForm.meetingLink,
            zoomAccount: approvalForm.zoomAccount,
            updatedAt: new Date().toISOString(),
            timeline: [
              ...(ticket.timeline || []),
              {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                action: "APPROVED",
                actor: currentUser.name,
                details: `Booking disetujui. Link Meeting: ${approvalForm.meetingLink}`,
              },
            ],
          };
        }
        return ticket;
      });

      await saveTickets(updatedTickets as any);

      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket) {
        await addNotification({
          userId: ticket.userId,
          title: "Zoom Booking Disetujui",
          message: `Booking ${ticket.ticketNumber} telah disetujui`,
          type: "success",
          read: false,
        });
      }

      toast.success("Booking berhasil disetujui");
      handleApproveCancel();
      setShowDetailDialog(false);
    },
    [approvalForm, currentUser.name, handleApproveCancel, tickets]
  );

  const handleRejectBooking = useCallback(
    async (ticketId: string) => {
      if (!rejectionReason.trim()) {
        toast.error("Alasan penolakan harus diisi");
        return;
      }

      const updatedTickets = tickets.map((ticket) => {
        if (ticket.id === ticketId && ticket.type === "zoom_meeting") {
          return {
            ...ticket,
            status: "rejected" as const,
            rejectionReason,
            updatedAt: new Date().toISOString(),
            timeline: [
              ...(ticket.timeline || []),
              {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                action: "REJECTED",
                actor: currentUser.name,
                details: `Booking ditolak. Alasan: ${rejectionReason}`,
              },
            ],
          };
        }
        return ticket;
      });

      await saveTickets(updatedTickets as any);

      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket) {
        await addNotification({
          userId: ticket.userId,
          title: "Zoom Booking Ditolak",
          message: `Booking ${ticket.ticketNumber} ditolak: ${rejectionReason}`,
          type: "error",
          read: false,
        });
      }

      toast.success("Booking berhasil ditolak");
      handleRejectCancel();
      setShowDetailDialog(false);
    },
    [currentUser.name, handleRejectCancel, rejectionReason, tickets]
  );

  const selectedZoomAccountDisplay = useMemo(
    () => resolveZoomAccountDisplay(selectedBooking),
    [selectedBooking]
  );

  const handleNavigateToTicket = (ticketId: string) => {
    // Save current view (zoom-booking) ke sessionStorage sebelum navigate ke detail
    // Ini memastikan ketika klik back, akan kembali ke zoom-booking, bukan tickets
    sessionStorage.setItem('previousView', 'zoom-booking');
    if (onViewTicket) {
      onViewTicket(ticketId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between max-md:flex-col max-md:items-start max-md:gap-4">
        <div>
          <h1 className="text-3xl font-bold max-md:text-2xl">
            {isManagement ? 'Kelola Zoom Booking' : 'Booking Zoom Meeting'}
          </h1>
          <p className="text-gray-500 mt-1 max-md:text-sm">
            {isManagement
              ? "Review dan kelola permintaan booking Zoom"
              : "Cek ketersediaan dan booking ruang Zoom meeting"}
          </p>
        </div>
        <div className="flex gap-2 max-md:w-full">
          <Button
            onClick={handleRefreshZoomData}
            variant="outline"
            className="gap-25"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          {!isManagement && (
            <Button
              onClick={() => {
                setShowQuickBookingDialog(true);
                setQuickBookingDate(new Date());
              }}
              variant="outline"
              className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer max-md:flex-1"
            >
              <Video className="h-4 w-4" />
              Request Slot Booking Zoom
            </Button>
          )}
        </div>
      </div>

      {!isManagement ? (
        <ZoomBookingUserTabs
          bookingGroups={bookingGroups}
          selectedDate={selectedDate}
          dailyTickets={dailyTickets}
          isLoadingDaily={isLoadingDaily}
          dailyError={dailyError}
          currentUser={currentUser}
          zoomAccounts={zoomAccounts}
          onDateChange={handleDailyGridDateChange}
          onViewTicketById={handleViewTicketById}
          onSelectBooking={handleSelectBooking}
          renderStatusBadge={renderStatusBadge}
        />
      ) : (
        <ZoomBookingManagementTabs
          bookingGroups={bookingGroups}
          currentUser={currentUser}
          onSelectBooking={handleSelectBooking}
          renderStatusBadge={renderStatusBadge}
        />
      )}

      <QuickBookingDialog
        open={showQuickBookingDialog}
        onOpenChange={handleQuickDialogOpenChange}
        bookingForm={bookingForm}
        onBookingFormChange={handleBookingFormChange}
        quickBookingDate={quickBookingDate}
        onQuickBookingDateChange={setQuickBookingDate}
        onSubmit={handleSubmitQuickBooking}
        onCancel={handleQuickDialogCancel}
        isSubmitting={isSubmittingQuick}
        coHostQuery={coHostQuery}
        onCoHostQueryChange={setCoHostQuery}
        onSearchCoHosts={searchCoHosts}
        isSearchingCoHost={isSearchingCoHost}
        coHostResults={coHostResults}
        selectedCoHostIds={selectedCoHostIds}
        onSelectCoHost={handleCoHostSelect}
        onRemoveCoHost={handleCoHostRemove}
        availableUsers={availableUsers}
        attachments={attachments}
        onAttachmentsChange={setAttachments}
      />

      <DetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        booking={selectedBooking}
        isManagement={isManagement}
        renderStatusBadge={renderStatusBadge}
        zoomAccountDisplay={selectedZoomAccountDisplay}
        onRequestApprove={() => setShowApproveDialog(true)}
        onRequestReject={() => setShowRejectDialog(true)}
        onClose={() => handleDetailDialogOpenChange(false)}
        onNavigateToTicket={handleNavigateToTicket}
        currentUser={currentUser}
      />

      <ApproveDialog
        open={showApproveDialog}
        onOpenChange={handleApproveDialogOpenChange}
        approvalForm={approvalForm}
        onApprovalFormChange={handleApprovalFormChange}
        onSubmit={() =>
          selectedBooking && handleApproveBooking(selectedBooking.id)
        }
        onCancel={handleApproveCancel}
        zoomProAccounts={zoomAccounts}
      />

      <RejectDialog
        open={showRejectDialog}
        onOpenChange={handleRejectDialogOpenChange}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onSubmit={() =>
          selectedBooking && handleRejectBooking(selectedBooking.id)
        }
        onCancel={handleRejectCancel}
      />
    </div>
  );
};
