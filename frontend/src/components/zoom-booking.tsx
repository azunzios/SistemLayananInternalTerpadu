import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Calendar } from './ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Video, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { getZoomBookings, getTickets, saveTickets, addNotification } from '../lib/storage';
import type { User, ZoomBooking } from '../types';
import type { ViewType } from './main-layout';
import { ZoomCalendarView } from './zoom-calendar-view';
import { ZoomDailyGrid } from './zoom-daily-grid';

interface ZoomBookingProps {
  currentUser: User;
  isManagement: boolean;
  onNavigate: (view: ViewType) => void;
}

// Daftar akun Zoom Pro yang tersedia
const ZOOM_PRO_ACCOUNTS = [
  { id: 'zoom1', name: 'Zoom Pro 1', email: 'zoom1@bps-ntb.go.id', hostKey: '4567891' },
  { id: 'zoom2', name: 'Zoom Pro 2', email: 'zoom2@bps-ntb.go.id', hostKey: '7891234' },
  { id: 'zoom3', name: 'Zoom Pro 3', email: 'zoom3@bps-ntb.go.id', hostKey: '2345678' },
];

// Generate time options dengan interval 30 menit dari 08:00 sampai 17:00
const generateTimeOptions = (): string[] => {
  const times: string[] = [];
  for (let hour = 8; hour <= 17; hour++) {
    times.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 17) {
      times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

// Time slots dari 08:00 - 17:00 (setiap slot 1 jam) - untuk tampilan grid
const TIME_SLOTS = [
  { start: '08:00', end: '09:00' },
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '12:00', end: '13:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' },
];

const QUOTA_PER_SLOT = 3; // 3 akun Zoom Pro tersedia

// Fungsi untuk mendapatkan jam-jam yang terpengaruh oleh booking
const getAffectedHours = (startTime: string, endTime: string): number[] => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const hours: number[] = [];
  
  // Tambahkan jam mulai
  hours.push(startHour);
  
  // Tambahkan jam-jam di antara
  for (let h = startHour + 1; h < endHour; h++) {
    hours.push(h);
  }
  
  // Tambahkan jam akhir jika bukan di jam:00 persis
  if (endMin > 0) {
    hours.push(endHour);
  }
  
  return [...new Set(hours)]; // Remove duplicates
};

// Fungsi untuk cek apakah 2 booking overlap
const isTimeOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const [start1Hour, start1Min] = start1.split(':').map(Number);
  const [end1Hour, end1Min] = end1.split(':').map(Number);
  const [start2Hour, start2Min] = start2.split(':').map(Number);
  const [end2Hour, end2Min] = end2.split(':').map(Number);
  
  const start1Minutes = start1Hour * 60 + start1Min;
  const end1Minutes = end1Hour * 60 + end1Min;
  const start2Minutes = start2Hour * 60 + start2Min;
  const end2Minutes = end2Hour * 60 + end2Min;
  
  return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
};

export const ZoomBooking: React.FC<ZoomBookingProps> = ({
  currentUser,
  isManagement,
  onNavigate,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalForm, setApprovalForm] = useState({
    meetingLink: '',
    passcode: '',
    zoomAccount: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Flexible booking state
  const [showFlexibleBookingDialog, setShowFlexibleBookingDialog] = useState(false);
  const [flexibleStartTime, setFlexibleStartTime] = useState('');
  const [flexibleEndTime, setFlexibleEndTime] = useState('');
  const [showFlexibleAvailability, setShowFlexibleAvailability] = useState(false);
  
  // Quick booking state
  const [showQuickBookingDialog, setShowQuickBookingDialog] = useState(false);
  const [quickBookingDate, setQuickBookingDate] = useState<Date | undefined>(undefined);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    title: '',
    purpose: '',
    participants: '',
    coHostName: '',
    breakoutRooms: '0',
    startTime: '',
    endTime: '',
  });

  const zoomBookings = getZoomBookings();
  const tickets = getTickets();

  // Get zoom meeting tickets
  const zoomTickets = tickets.filter(t => t.type === 'zoom_meeting');

  // Filter based on view mode
  const myBookings = isManagement
    ? zoomTickets
    : zoomTickets.filter(t => t.userId === currentUser.id);

  // Group by status
  const bookingGroups = useMemo(() => {
    return {
      all: myBookings,
      pending: myBookings.filter(t => t.status === 'menunggu_review' || t.status === 'pending_approval'),
      approved: myBookings.filter(t => t.status === 'approved'),
      rejected: myBookings.filter(t => t.status === 'ditolak' || t.status === 'rejected'),
    };
  }, [myBookings]);

  // Get slot availability for selected date
  const getSlotAvailability = (slot: { start: string; end: string }) => {
    if (!selectedDate) return { used: 0, available: QUOTA_PER_SLOT };

    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // Count approved bookings for this slot
    const usedSlots = zoomTickets.filter(t => {
      if (t.status !== 'approved' && t.status !== 'menunggu_review' && t.status !== 'pending_approval') {
        return false;
      }
      if (t.data?.meetingDate !== dateStr) return false;
      
      // Check if booking overlaps with this slot
      const bookingStart = t.data?.startTime;
      const bookingEnd = t.data?.endTime;
      
      return bookingStart === slot.start && bookingEnd === slot.end;
    }).length;

    return {
      used: usedSlots,
      available: QUOTA_PER_SLOT - usedSlots,
    };
  };

  const handleCheckAvailability = () => {
    if (!selectedDate) {
      toast.error('Pilih tanggal terlebih dahulu');
      return;
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error('Tidak dapat memilih tanggal yang sudah lewat');
      return;
    }

    toast.success('Menampilkan ketersediaan slot');
  };

  const handleBookSlot = (slot: { start: string; end: string }) => {
    const availability = getSlotAvailability(slot);
    
    if (availability.available <= 0) {
      toast.error('Slot sudah penuh');
      return;
    }

    setSelectedSlot(slot);
    setShowBookingDialog(true);
  };

  const handleCreateTicketFromGrid = () => {
    setShowBookingDialog(true);
  };

  const handleDailyGridDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSubmitBooking = () => {
    if (!selectedDate) return;

    // Validation
    if (!bookingForm.title.trim()) {
      toast.error('Judul meeting harus diisi');
      return;
    }
    if (!bookingForm.purpose.trim()) {
      toast.error('Deskripsi peminjaman zoom harus diisi');
      return;
    }
    if (!bookingForm.participants.trim() || parseInt(bookingForm.participants) <= 0) {
      toast.error('Jumlah peserta harus diisi dengan benar');
      return;
    }
    if (!bookingForm.coHostName.trim()) {
      toast.error('Nama penerima akses co-host harus diisi');
      return;
    }
    if (!bookingForm.startTime) {
      toast.error('Waktu mulai harus diisi');
      return;
    }
    if (!bookingForm.endTime) {
      toast.error('Waktu selesai harus diisi');
      return;
    }

    // Validate start time is before end time
    const [startHour, startMin] = bookingForm.startTime.split(':').map(Number);
    const [endHour, endMin] = bookingForm.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      toast.error('Waktu selesai harus lebih besar dari waktu mulai');
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // Create new ticket
    const newTicket = {
      id: Date.now().toString(),
      ticketNumber: `ZM${Date.now().toString().slice(-6)}`,
      type: 'zoom_meeting' as const,
      title: bookingForm.title,
      description: bookingForm.purpose,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhone: currentUser.phone,
      unitKerja: currentUser.unitKerja,
      status: 'menunggu_review' as const,
      priority: 'normal' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {
        meetingDate: dateStr,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        estimatedParticipants: parseInt(bookingForm.participants),
        coHostName: bookingForm.coHostName,
        breakoutRooms: parseInt(bookingForm.breakoutRooms),
      },
      timeline: [
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          action: 'CREATED',
          actor: currentUser.name,
          details: 'Booking Zoom dibuat',
        },
      ],
    };

    const updatedTickets = [...tickets, newTicket];
    saveTickets(updatedTickets);

    // Add notification for admin layanan
    addNotification({
      userId: 'admin-layanan', // This should be dynamic in production
      title: 'Booking Zoom Baru',
      message: `${currentUser.name} mengajukan booking Zoom`,
      type: 'info',
      read: false,
      link: 'zoom-management',
    });

    toast.success('Booking berhasil diajukan!');
    
    // Reset form
    setShowBookingDialog(false);
    setBookingForm({
      title: '',
      purpose: '',
      participants: '',
      coHostName: '',
      breakoutRooms: '0',
      startTime: '',
      endTime: '',
    });
    setSelectedSlot(null);
  };

  // Flexible booking functions
  const handleOpenFlexibleBooking = () => {
    if (!selectedDate) {
      toast.error('Pilih tanggal terlebih dahulu');
      return;
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error('Tidak dapat memilih tanggal yang sudah lewat');
      return;
    }

    setShowFlexibleBookingDialog(true);
    setFlexibleStartTime('');
    setFlexibleEndTime('');
    setShowFlexibleAvailability(false);
  };

  const checkFlexibleAvailability = () => {
    if (!flexibleStartTime || !flexibleEndTime) {
      toast.error('Pilih waktu mulai dan selesai');
      return;
    }

    // Convert time to minutes for comparison
    const [startHour, startMin] = flexibleStartTime.split(':').map(Number);
    const [endHour, endMin] = flexibleEndTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Validation: minimum duration 30 minutes
    if (endMinutes <= startMinutes) {
      toast.error('Waktu selesai harus lebih dari waktu mulai');
      return;
    }

    if (endMinutes - startMinutes < 30) {
      toast.error('Durasi minimum meeting adalah 30 menit');
      return;
    }

    // Validation: must be within working hours (08:00 - 17:00)
    if (startMinutes < 8 * 60 || endMinutes > 17 * 60) {
      toast.error('Waktu meeting harus dalam jam kerja (08:00 - 17:00)');
      return;
    }

    setShowFlexibleAvailability(true);
    toast.success('Cek ketersediaan berhasil');
  };

  const getFlexibleAvailability = () => {
    if (!selectedDate || !flexibleStartTime || !flexibleEndTime) {
      return { available: QUOTA_PER_SLOT, used: 0, conflicts: [] };
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // Get all bookings for the selected date
    const dayBookings = zoomTickets.filter(t => {
      if (t.status !== 'approved' && t.status !== 'menunggu_review' && t.status !== 'pending_approval') {
        return false;
      }
      return t.data?.meetingDate === dateStr;
    });

    // Check for conflicts (overlapping bookings)
    const conflicts = dayBookings.filter(booking => {
      return isTimeOverlap(
        flexibleStartTime,
        flexibleEndTime,
        booking.data.startTime,
        booking.data.endTime
      );
    });

    const used = conflicts.length;
    const available = QUOTA_PER_SLOT - used;

    return { available, used, conflicts };
  };

  const handleSubmitFlexibleBooking = () => {
    if (!selectedDate || !flexibleStartTime || !flexibleEndTime) return;

    // Validation
    if (!bookingForm.title.trim()) {
      toast.error('Judul meeting harus diisi');
      return;
    }
    if (!bookingForm.purpose.trim()) {
      toast.error('Deskripsi peminjaman zoom harus diisi');
      return;
    }
    if (!bookingForm.participants.trim() || parseInt(bookingForm.participants) <= 0) {
      toast.error('Jumlah peserta harus diisi dengan benar');
      return;
    }
    if (!bookingForm.coHostName.trim()) {
      toast.error('Nama penerima akses co-host harus diisi');
      return;
    }

    // Check availability one more time
    const availability = getFlexibleAvailability();
    if (availability.available <= 0) {
      toast.error('Waktu yang dipilih sudah penuh, silakan pilih waktu lain');
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // Calculate duration
    const [startHour, startMin] = flexibleStartTime.split(':').map(Number);
    const [endHour, endMin] = flexibleEndTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    // Create new ticket
    const newTicket = {
      id: Date.now().toString(),
      ticketNumber: `ZM${Date.now().toString().slice(-6)}`,
      type: 'zoom_meeting' as const,
      title: bookingForm.title,
      description: bookingForm.purpose,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhone: currentUser.phone,
      unitKerja: currentUser.unitKerja,
      status: 'menunggu_review' as const,
      priority: 'normal' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {
        meetingDate: dateStr,
        startTime: flexibleStartTime,
        endTime: flexibleEndTime,
        duration: durationMinutes,
        estimatedParticipants: parseInt(bookingForm.participants),
        coHostName: bookingForm.coHostName,
        breakoutRooms: parseInt(bookingForm.breakoutRooms),
      },
      timeline: [
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          action: 'CREATED',
          actor: currentUser.name,
          details: 'Booking Zoom dibuat (Waktu Fleksibel)',
        },
      ],
    };

    const updatedTickets = [...tickets, newTicket];
    saveTickets(updatedTickets);

    // Add notification for admin layanan
    addNotification({
      userId: 'admin-layanan', // This should be dynamic in production
      title: 'Booking Zoom Baru',
      message: `${currentUser.name} mengajukan booking Zoom`,
      type: 'info',
      read: false,
      link: 'zoom-management',
    });

    toast.success('Booking berhasil diajukan!');
    
    // Reset form
    setShowFlexibleBookingDialog(false);
    setBookingForm({
      title: '',
      purpose: '',
      participants: '',
      coHostName: '',
      breakoutRooms: '0',
    });
    setFlexibleStartTime('');
    setFlexibleEndTime('');
    setShowFlexibleAvailability(false);
  };

  // Quick booking handler
  const handleSubmitQuickBooking = () => {
    if (!quickBookingDate) {
      toast.error('Tanggal meeting harus dipilih');
      return;
    }

    // Validation
    if (!bookingForm.title.trim()) {
      toast.error('Judul meeting harus diisi');
      return;
    }
    if (!bookingForm.purpose.trim()) {
      toast.error('Deskripsi peminjaman zoom harus diisi');
      return;
    }
    if (!bookingForm.startTime) {
      toast.error('Waktu mulai harus diisi');
      return;
    }
    if (!bookingForm.endTime) {
      toast.error('Waktu selesai harus diisi');
      return;
    }
    if (!bookingForm.participants.trim() || parseInt(bookingForm.participants) <= 0) {
      toast.error('Jumlah peserta harus diisi dengan benar');
      return;
    }
    if (!bookingForm.coHostName.trim()) {
      toast.error('Nama penerima akses co-host harus diisi');
      return;
    }

    // Validate start time is before end time
    const [startHour, startMin] = bookingForm.startTime.split(':').map(Number);
    const [endHour, endMin] = bookingForm.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      toast.error('Waktu selesai harus lebih besar dari waktu mulai');
      return;
    }

    const dateStr = quickBookingDate.toISOString().split('T')[0];
    
    // Create new ticket
    const newTicket = {
      id: Date.now().toString(),
      ticketNumber: `ZM${Date.now().toString().slice(-6)}`,
      type: 'zoom_meeting' as const,
      title: bookingForm.title,
      description: bookingForm.purpose,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhone: currentUser.phone,
      unitKerja: currentUser.unitKerja,
      status: 'menunggu_review' as const,
      priority: 'normal' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {
        meetingDate: dateStr,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        estimatedParticipants: parseInt(bookingForm.participants),
        coHostName: bookingForm.coHostName,
        breakoutRooms: parseInt(bookingForm.breakoutRooms),
      },
      timeline: [
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          action: 'CREATED',
          actor: currentUser.name,
          details: 'Booking Zoom dibuat',
        },
      ],
    };

    const updatedTickets = [...tickets, newTicket];
    saveTickets(updatedTickets);

    // Add notification for admin layanan
    addNotification({
      userId: 'admin-layanan', // This should be dynamic in production
      title: 'Booking Zoom Baru',
      message: `${currentUser.name} mengajukan booking Zoom`,
      type: 'info',
      read: false,
      link: 'zoom-management',
    });

    toast.success('Booking berhasil diajukan!');
    
    // Reset form
    setShowQuickBookingDialog(false);
    setQuickBookingDate(undefined);
    setBookingForm({
      title: '',
      purpose: '',
      participants: '',
      coHostName: '',
      breakoutRooms: '0',
      startTime: '',
      endTime: '',
    });
  };

  const handleApproveBooking = (ticketId: string) => {
    // Validation
    if (!approvalForm.meetingLink.trim()) {
      toast.error('Link Meeting harus diisi');
      return;
    }
    if (!approvalForm.passcode.trim()) {
      toast.error('Passcode harus diisi');
      return;
    }
    if (!approvalForm.zoomAccount.trim()) {
      toast.error('Akun Zoom harus dipilih');
      return;
    }

    // Extract meeting ID from link (format: https://zoom.us/j/123456789)
    const linkParts = approvalForm.meetingLink.match(/\/j\/(\d+)/);
    const meetingId = linkParts ? linkParts[1] : 'N/A';

    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'approved' as const,
          data: {
            ...t.data,
            meetingId,
            passcode: approvalForm.passcode,
            meetingLink: approvalForm.meetingLink,
            zoomAccount: approvalForm.zoomAccount,
          },
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'APPROVED',
              actor: currentUser.name,
              details: `Booking disetujui. Link Meeting: ${approvalForm.meetingLink}`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      addNotification({
        userId: ticket.userId,
        title: 'Zoom Booking Disetujui',
        message: `Booking ${ticket.ticketNumber} telah disetujui`,
        type: 'success',
        read: false,
      });
    }

    toast.success('Booking berhasil disetujui');
    setShowApproveDialog(false);
    setShowDetailDialog(false);
    setApprovalForm({ meetingLink: '', passcode: '', zoomAccount: '' });
  };

  const handleRejectBooking = (ticketId: string) => {
    // Validation
    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'ditolak' as const,
          data: {
            ...t.data,
            rejectionReason: rejectionReason,
          },
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'REJECTED',
              actor: currentUser.name,
              details: `Booking ditolak. Alasan: ${rejectionReason}`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      addNotification({
        userId: ticket.userId,
        title: 'Zoom Booking Ditolak',
        message: `Booking ${ticket.ticketNumber} ditolak: ${rejectionReason}`,
        type: 'error',
        read: false,
      });
    }

    toast.success('Booking berhasil ditolak');
    setShowRejectDialog(false);
    setShowDetailDialog(false);
    setRejectionReason('');
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string; icon: any }> = {
      menunggu_review: { variant: 'secondary', label: 'Pending', icon: Clock },
      pending_approval: { variant: 'secondary', label: 'Pending', icon: Clock },
      approved: { variant: 'default', label: 'Disetujui', icon: CheckCircle },
      ditolak: { variant: 'destructive', label: 'Ditolak', icon: XCircle },
      rejected: { variant: 'destructive', label: 'Ditolak', icon: XCircle },
      dibatalkan: { variant: 'secondary', label: 'Dibatalkan', icon: XCircle },
    };

    const statusConfig = config[status] || config.pending_approval;
    const Icon = statusConfig.icon;

    return (
      <Badge variant={statusConfig.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  // Check if date has bookings
  const hasBookings = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return zoomTickets.some(t => t.data?.meetingDate === dateStr);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">
            {isManagement ? 'Kelola Zoom Booking' : 'Booking Zoom Meeting'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isManagement
              ? 'Review dan kelola permintaan booking Zoom'
              : 'Cek ketersediaan dan booking ruang Zoom meeting'}
          </p>
        </div>
        {!isManagement && (
          <Button 
            onClick={() => {
              setShowQuickBookingDialog(true);
              setQuickBookingDate(new Date());
            }}
            className="gap-2 bg-cyan-600 hover:bg-cyan-700"
          >
            <Video className="h-4 w-4" />
            Request Slot Booking Zoom
          </Button>
        )}
      </div>

      {!isManagement ? (
        /* User View - Check Availability & Booking */
        <Tabs defaultValue="check-availability" className="space-y-4">
          <TabsList>
            <TabsTrigger value="check-availability" className="gap-2">
              <Search className="h-4 w-4" />
              Cek Ketersediaan
            </TabsTrigger>
            <TabsTrigger value="my-bookings" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Booking Saya
            </TabsTrigger>
          </TabsList>

          {/* Check Availability Tab */}
          <TabsContent value="check-availability" className="space-y-4">
            {/* Skeleton sebelum tanggal dipilih */}
            {!selectedDate ? (
              <div className="space-y-4">
                {/* Date Input Card - Always show */}
                <ZoomDailyGrid
                  tickets={zoomTickets}
                  selectedDate={selectedDate}
                  onDateChange={handleDailyGridDateChange}
                />
                
                {/* Skeleton Grid */}
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-96 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Header Skeleton */}
                      <div className="grid grid-cols-4 gap-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                      
                      {/* Rows Skeleton */}
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                        <div key={i} className="grid grid-cols-4 gap-2">
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
              /* Daily Grid View */
              <ZoomDailyGrid
                tickets={zoomTickets}
                selectedDate={selectedDate}
                onDateChange={handleDailyGridDateChange}
              />
            )}
          </TabsContent>

          {/* My Bookings Tab */}
          <TabsContent value="my-bookings" className="space-y-4">
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">
                  Semua ({bookingGroups.all.length})
                </TabsTrigger>
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

              {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
                <TabsContent key={tab} value={tab}>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nomor Tiket</TableHead>
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
                              <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>Tidak ada booking</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            bookingGroups[tab].map(booking => (
                              <TableRow key={booking.id} className="hover:bg-gray-50">
                                <TableCell className="font-mono text-sm">
                                  {booking.ticketNumber}
                                </TableCell>
                                <TableCell>
                                  <p>{booking.title}</p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm">
                                    {booking.data?.meetingDate &&
                                      new Date(booking.data.meetingDate).toLocaleDateString('id-ID')}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {booking.data?.startTime} - {booking.data?.endTime}
                                  </p>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {booking.data?.estimatedParticipants} orang
                                </TableCell>
                                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setShowDetailDialog(true);
                                    }}
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
          </TabsContent>
        </Tabs>
      ) : (
        /* Management View */
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Kalender
            </TabsTrigger>
            <TabsTrigger value="all">
              Semua ({bookingGroups.all.length})
            </TabsTrigger>
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

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <ZoomCalendarView currentUser={currentUser} />
          </TabsContent>

          {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
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
                            <TableCell className="font-mono text-sm">
                              {booking.ticketNumber}
                            </TableCell>
                            <TableCell>
                              <p>{booking.userName}</p>
                              <p className="text-xs text-gray-500">{booking.unitKerja}</p>
                            </TableCell>
                            <TableCell>
                              <p>{booking.title}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">
                                {booking.data?.meetingDate &&
                                  new Date(booking.data.meetingDate).toLocaleDateString('id-ID')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {booking.data?.startTime} - {booking.data?.endTime}
                              </p>
                            </TableCell>
                            <TableCell className="text-sm">
                              {booking.data?.estimatedParticipants} orang
                            </TableCell>
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowDetailDialog(true);
                                }}
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
      )}

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Slot Meeting</DialogTitle>
            <DialogDescription>
              {selectedDate?.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Meeting *</Label>
              <Input
                id="title"
                placeholder="Contoh: Rapat Koordinasi Tim"
                value={bookingForm.title}
                onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coHostName">Nama Penerima Akses Co-Host *</Label>
              <Input
                id="coHostName"
                placeholder="Contoh: Budi Santoso"
                value={bookingForm.coHostName}
                onChange={(e) => setBookingForm({ ...bookingForm, coHostName: e.target.value })}
              />
              <p className="text-xs text-gray-500">Nama lengkap orang yang akan menjadi co-host meeting</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Waktu Mulai *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="startTime"
                    type="time"
                    value={bookingForm.startTime || ''}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="pl-10"
                    min="07:00"
                    max="17:00"
                  />
                </div>
                <p className="text-xs text-gray-500">Jam operasional: 07:00 - 17:00</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Waktu Selesai *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="endTime"
                    type="time"
                    value={bookingForm.endTime || ''}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    className="pl-10"
                    min="07:00"
                    max="17:00"
                  />
                </div>
                <p className="text-xs text-gray-500">Jam operasional: 07:00 - 17:00</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breakoutRooms">Jumlah Breakout Room *</Label>
                <Input
                  id="breakoutRooms"
                  type="number"
                  placeholder="0"
                  value={bookingForm.breakoutRooms}
                  onChange={(e) => setBookingForm({ ...bookingForm, breakoutRooms: e.target.value })}
                  min="0"
                  max="50"
                />
                <p className="text-xs text-gray-500">Isikan 0 jika tidak memerlukan</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="participants">Jumlah Peserta Zoom *</Label>
                <Input
                  id="participants"
                  type="number"
                  placeholder="10"
                  value={bookingForm.participants}
                  onChange={(e) => setBookingForm({ ...bookingForm, participants: e.target.value })}
                  min="2"
                  max="300"
                />
                <p className="text-xs text-gray-500">Estimasi jumlah peserta</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Deskripsi Peminjaman Zoom *</Label>
              <Textarea
                id="purpose"
                placeholder="Jelaskan tujuan dan agenda meeting..."
                value={bookingForm.purpose}
                onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmitBooking}>
              <Video className="h-4 w-4 mr-2" />
              Submit Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flexible Booking Dialog */}
      <Dialog open={showFlexibleBookingDialog} onOpenChange={setShowFlexibleBookingDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking dengan Waktu Fleksibel</DialogTitle>
            <DialogDescription>
              {selectedDate?.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Time Selection */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm mb-3">Pilih Waktu Meeting</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flexStartTime">Waktu Mulai *</Label>
                  <Select value={flexibleStartTime} onValueChange={setFlexibleStartTime}>
                    <SelectTrigger id="flexStartTime">
                      <SelectValue placeholder="Pilih waktu mulai" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.slice(0, -1).map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flexEndTime">Waktu Selesai *</Label>
                  <Select value={flexibleEndTime} onValueChange={setFlexibleEndTime}>
                    <SelectTrigger id="flexEndTime">
                      <SelectValue placeholder="Pilih waktu selesai" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.filter(time => {
                        if (!flexibleStartTime) return true;
                        const [sh, sm] = flexibleStartTime.split(':').map(Number);
                        const [th, tm] = time.split(':').map(Number);
                        return (th * 60 + tm) > (sh * 60 + sm);
                      }).map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <Button 
                  size="sm" 
                  onClick={checkFlexibleAvailability}
                  disabled={!flexibleStartTime || !flexibleEndTime}
                >
                  Cek Ketersediaan
                </Button>
              </div>
            </div>

            {/* Availability Status */}
            <AnimatePresence>
              {showFlexibleAvailability && (() => {
                const availability = getFlexibleAvailability();
                const isAvailable = availability.available > 0;
                const [startHour, startMin] = flexibleStartTime.split(':').map(Number);
                const [endHour, endMin] = flexibleEndTime.split(':').map(Number);
                const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                const hours = Math.floor(durationMinutes / 60);
                const minutes = durationMinutes % 60;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`border rounded-lg p-4 ${
                      isAvailable
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isAvailable ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-2">
                          {isAvailable ? '✓ Waktu Tersedia' : '✗ Waktu Tidak Tersedia'}
                        </p>
                        <div className="text-sm space-y-1">
                          <p>Durasi: {hours > 0 && `${hours} jam `}{minutes > 0 && `${minutes} menit`}</p>
                          <p>Akun tersedia: {availability.available} dari {QUOTA_PER_SLOT}</p>
                          {availability.conflicts.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="font-medium mb-1">Bentrok dengan booking:</p>
                              <ul className="list-disc list-inside text-xs space-y-0.5">
                                {availability.conflicts.map((conflict: any, idx: number) => (
                                  <li key={idx}>
                                    {conflict.title} ({conflict.data.startTime} - {conflict.data.endTime})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* Only show form if time is available */}
            {showFlexibleAvailability && getFlexibleAvailability().available > 0 && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm">Detail Booking</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="flexTitle">Judul Meeting *</Label>
                  <Input
                    id="flexTitle"
                    placeholder="Contoh: Rapat Koordinasi Tim"
                    value={bookingForm.title}
                    onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flexCoHostName">Nama Penerima Akses Co-Host *</Label>
                  <Input
                    id="flexCoHostName"
                    placeholder="Contoh: Budi Santoso"
                    value={bookingForm.coHostName}
                    onChange={(e) => setBookingForm({ ...bookingForm, coHostName: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">Nama lengkap orang yang akan menjadi co-host meeting</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="flexBreakoutRooms">Jumlah Breakout Room *</Label>
                    <Input
                      id="flexBreakoutRooms"
                      type="number"
                      placeholder="0"
                      value={bookingForm.breakoutRooms}
                      onChange={(e) => setBookingForm({ ...bookingForm, breakoutRooms: e.target.value })}
                      min="0"
                      max="50"
                    />
                    <p className="text-xs text-gray-500">Isikan 0 jika tidak memerlukan</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flexParticipants">Jumlah Peserta Zoom *</Label>
                    <Input
                      id="flexParticipants"
                      type="number"
                      placeholder="10"
                      value={bookingForm.participants}
                      onChange={(e) => setBookingForm({ ...bookingForm, participants: e.target.value })}
                      min="2"
                      max="300"
                    />
                    <p className="text-xs text-gray-500">Estimasi jumlah peserta</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flexPurpose">Deskripsi Peminjaman Zoom *</Label>
                  <Textarea
                    id="flexPurpose"
                    placeholder="Jelaskan tujuan dan agenda meeting..."
                    value={bookingForm.purpose}
                    onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowFlexibleBookingDialog(false);
                setFlexibleStartTime('');
                setFlexibleEndTime('');
                setShowFlexibleAvailability(false);
              }}
            >
              Batal
            </Button>
            {showFlexibleAvailability && getFlexibleAvailability().available > 0 && (
              <Button onClick={handleSubmitFlexibleBooking}>
                <Video className="h-4 w-4 mr-2" />
                Submit Booking
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Booking Dialog */}
      <Dialog open={showQuickBookingDialog} onOpenChange={setShowQuickBookingDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="bg-cyan-100 p-2 rounded-lg">
                <Video className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <DialogTitle>Booking Zoom Meeting</DialogTitle>
                <DialogDescription>
                  Lengkapi form di bawah untuk mengajukan zoom meeting
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quickTitle">Judul Meeting *</Label>
              <Input
                id="quickTitle"
                placeholder="Contoh: Rapat Koordinasi Tim"
                value={bookingForm.title}
                onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickPurpose">Deskripsi Peminjaman Zoom *</Label>
              <Textarea
                id="quickPurpose"
                placeholder="Jelaskan tujuan dan agenda meeting..."
                value={bookingForm.purpose}
                onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                rows={3}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm mb-3">Detail Booking Zoom</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quickDate">Tanggal Meeting *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {quickBookingDate ? (
                          quickBookingDate.toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        ) : (
                          <span className="text-gray-500">Pilih tanggal meeting</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={quickBookingDate}
                        onSelect={setQuickBookingDate}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-red-600">Pilih tanggal pelaksanaan meeting</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quickStartTime">Waktu Mulai *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="quickStartTime"
                        type="time"
                        value={bookingForm.startTime || ''}
                        onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-blue-600">Jam operasional: 07:00 - 17:00</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quickEndTime">Waktu Selesai *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="quickEndTime"
                        type="time"
                        value={bookingForm.endTime || ''}
                        onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-blue-600">Jam operasional: 07:00 - 17:00</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quickCoHost">Nama Penerima Akses Co-Host *</Label>
                  <Input
                    id="quickCoHost"
                    placeholder="Contoh: Budi Santoso"
                    value={bookingForm.coHostName}
                    onChange={(e) => setBookingForm({ ...bookingForm, coHostName: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">Nama lengkap orang yang akan menjadi co-host meeting</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quickBreakoutRooms">Jumlah Breakout Room *</Label>
                    <Input
                      id="quickBreakoutRooms"
                      type="number"
                      placeholder="0"
                      value={bookingForm.breakoutRooms}
                      onChange={(e) => setBookingForm({ ...bookingForm, breakoutRooms: e.target.value })}
                      min="0"
                      max="50"
                    />
                    <p className="text-xs text-gray-500">Isikan 0 jika tidak memerlukan breakout room</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quickParticipants">Jumlah Peserta Zoom *</Label>
                    <Input
                      id="quickParticipants"
                      type="number"
                      placeholder="10"
                      value={bookingForm.participants}
                      onChange={(e) => setBookingForm({ ...bookingForm, participants: e.target.value })}
                      min="2"
                      max="300"
                    />
                    <p className="text-xs text-gray-500">Estimasi jumlah peserta yang akan hadir</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quickFile">Upload File Pendukung (Optional)</Label>
                  <Input
                    id="quickFile"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">Maksimal 5 file. Format: JPG, PNG, PDF, DOC (Maks 2MB per file)</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowQuickBookingDialog(false);
                setQuickBookingDate(undefined);
                setBookingForm({
                  title: '',
                  purpose: '',
                  participants: '',
                  coHostName: '',
                  breakoutRooms: '0',
                  startTime: '',
                  endTime: '',
                });
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSubmitQuickBooking} className="bg-cyan-600 hover:bg-cyan-700">
              Ajukan Tiket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBooking?.title}</DialogTitle>
            <DialogDescription>
              Nomor Tiket: {selectedBooking?.ticketNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tanggal</p>
                  <p>
                    {selectedBooking.data?.meetingDate &&
                      new Date(selectedBooking.data.meetingDate).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Waktu</p>
                  <p>
                    {selectedBooking.data?.startTime} - {selectedBooking.data?.endTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nama Co-Host</p>
                  <p>{selectedBooking.data?.coHostName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jumlah Breakout Room</p>
                  <p>{selectedBooking.data?.breakoutRooms || 0} room</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jumlah Peserta</p>
                  <p>{selectedBooking.data?.estimatedParticipants} orang</p>
                </div>
                {isManagement && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Pemohon</p>
                      <p>{selectedBooking.userName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Unit Kerja</p>
                      <p>{selectedBooking.unitKerja}</p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500">Deskripsi Peminjaman Zoom</p>
                <p className="mt-1">{selectedBooking.description}</p>
              </div>

              {selectedBooking.status === 'approved' && selectedBooking.data?.meetingLink && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-green-900 mb-3">Meeting Credentials</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedBooking.data?.zoomAccount && (
                      <>
                        <div>
                          <p className="text-green-700">Akun Zoom:</p>
                          <p className="font-mono">
                            {ZOOM_PRO_ACCOUNTS.find(acc => acc.id === selectedBooking.data.zoomAccount)?.name || selectedBooking.data.zoomAccount}
                          </p>
                        </div>
                        <div>
                          <p className="text-green-700">Host Key:</p>
                          <p className="font-mono">
                            {ZOOM_PRO_ACCOUNTS.find(acc => acc.id === selectedBooking.data.zoomAccount)?.hostKey || '-'}
                          </p>
                        </div>
                      </>
                    )}
                    <div className="col-span-2">
                      <p className="text-green-700">Link Meeting:</p>
                      <a
                        href={selectedBooking.data.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-mono break-all"
                      >
                        {selectedBooking.data.meetingLink}
                      </a>
                    </div>
                    <div>
                      <p className="text-green-700">Meeting ID:</p>
                      <p className="font-mono">{selectedBooking.data.meetingId}</p>
                    </div>
                    <div>
                      <p className="text-green-700">Passcode:</p>
                      <p className="font-mono">{selectedBooking.data.passcode}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">Status:</p>
                {getStatusBadge(selectedBooking.status)}
              </div>
            </div>
          )}

          <DialogFooter>
            {isManagement &&
              selectedBooking?.status !== 'approved' &&
              selectedBooking?.status !== 'ditolak' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectDialog(true);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Tolak
                  </Button>
                  <Button
                    onClick={() => {
                      setShowApproveDialog(true);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Setujui
                  </Button>
                </>
              )}
            {!isManagement && (
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Tutup
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setujui Booking Zoom</DialogTitle>
            <DialogDescription>
              Masukkan link meeting dan passcode yang telah dibuat di Portal Web Zoom
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Catatan:</strong> Sebelum menyetujui, pastikan Anda sudah membuat meeting di Portal Web Zoom terlebih dahulu.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetingLink">Link Meeting Zoom *</Label>
              <Input
                id="meetingLink"
                placeholder="https://zoom.us/j/123456789"
                value={approvalForm.meetingLink}
                onChange={(e) => setApprovalForm({ ...approvalForm, meetingLink: e.target.value })}
              />
              <p className="text-xs text-gray-500">Contoh: https://zoom.us/j/123456789</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passcode">Passcode Meeting *</Label>
              <Input
                id="passcode"
                placeholder="ABC123"
                value={approvalForm.passcode}
                onChange={(e) => setApprovalForm({ ...approvalForm, passcode: e.target.value })}
              />
              <p className="text-xs text-gray-500">Masukkan passcode yang telah dibuat</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zoomAccount">Akun Zoom *</Label>
              <Select
                value={approvalForm.zoomAccount}
                onValueChange={(value) => setApprovalForm({ ...approvalForm, zoomAccount: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih akun Zoom Pro" />
                </SelectTrigger>
                <SelectContent>
                  {ZOOM_PRO_ACCOUNTS.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Pilih akun Zoom Pro yang digunakan untuk meeting ini</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setApprovalForm({ meetingLink: '', passcode: '', zoomAccount: '' });
              }}
            >
              Batal
            </Button>
            <Button onClick={() => selectedBooking && handleApproveBooking(selectedBooking.id)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Konfirmasi Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Booking Zoom</DialogTitle>
            <DialogDescription>
              Masukkan alasan penolakan booking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Alasan Penolakan *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Contoh: Jadwal bentrok dengan kegiatan lain / Prioritas kegiatan rendah"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-gray-500">Jelaskan alasan penolakan dengan jelas</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedBooking && handleRejectBooking(selectedBooking.id)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Konfirmasi Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};