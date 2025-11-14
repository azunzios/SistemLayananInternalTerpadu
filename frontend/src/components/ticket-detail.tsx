import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Alert, AlertDescription } from './ui/alert';
import { TicketProgressTracker } from './ticket-progress-tracker';
import { TeknisiWorkflow } from './teknisi-workflow-new';
import { ZoomAdminReviewModal } from './zoom-admin-review-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  ArrowLeft,
  Clock,
  User,
  CheckCircle,
  XCircle,
  MessageSquare,
  Paperclip,
  Send,
  UserCheck,
  Package,
  Wrench,
  Activity,
  AlertCircle,
  Truck,
  MapPin,
  Monitor,
  Cpu,
  FileText,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  FolderKanban,
} from 'lucide-react';
import type { Ticket, User, TimelineEvent, TicketStatus, UrgencyLevel } from '../types';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getTickets, saveTickets, getUsers, addNotification, createWorkOrder, getWorkOrdersByTicket } from '../lib/storage';
import type { ViewType } from './main-layout';

// Daftar akun Zoom Pro yang tersedia
const ZOOM_PRO_ACCOUNTS = [
  { id: 'zoom1', name: 'Zoom Pro 1', email: 'zoom1@bps-ntb.go.id', hostKey: '4567891' },
  { id: 'zoom2', name: 'Zoom Pro 2', email: 'zoom2@bps-ntb.go.id', hostKey: '7891234' },
  { id: 'zoom3', name: 'Zoom Pro 3', email: 'zoom3@bps-ntb.go.id', hostKey: '2345678' },
];

interface TicketDetailProps {
  ticketId: string;
  currentUser: User;
  onBack: () => void;
  onNavigate: (view: ViewType) => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({
  ticketId,
  currentUser,
  onBack,
  onNavigate,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const tickets = useMemo(() => getTickets(), [refreshKey]);
  const users = getUsers();
  const ticket = tickets.find(t => t.id === ticketId);

  // Helper function to format actor name
  const formatActorName = (actor: string): string => {
    // Check if actor is a user ID (format: user-X)
    if (/^user-\d+$/.test(actor)) {
      return 'Sistem';
    }
    
    // Try to find user by name
    const user = users.find(u => u.name === actor);
    if (user) {
      return user.name;
    }
    
    // Return as is if not a user ID
    return actor;
  };

  const [comment, setComment] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showTeknisiCompleteDialog, setShowTeknisiCompleteDialog] = useState(false);
  const [showSparepartDialog, setShowSparepartDialog] = useState(false);
  const [showZoomReviewModal, setShowZoomReviewModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [sparepartName, setSparepartName] = useState('');
  const [sparepartDescription, setSparepartDescription] = useState('');
  const [sparepartEstimatedPrice, setSparepartEstimatedPrice] = useState('');
  const [sparepartUrgency, setSparepartUrgency] = useState<UrgencyLevel>('normal');
  const [workOrderType, setWorkOrderType] = useState<'sparepart' | 'vendor'>('sparepart');
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<TicketStatus>('sedang_diagnosa');
  const [progressNotes, setProgressNotes] = useState('');
  
  // Teknisi Accept/Reject states
  const [showTeknisiAcceptDialog, setShowTeknisiAcceptDialog] = useState(false);
  const [showTeknisiRejectDialog, setShowTeknisiRejectDialog] = useState(false);
  const [teknisiRejectReason, setTeknisiRejectReason] = useState('');
  const [estimatedSchedule, setEstimatedSchedule] = useState('');

  // Teknisi Diagnosa states
  const [showDiagnosaDialog, setShowDiagnosaDialog] = useState(false);
  const [diagnosaForm, setDiagnosaForm] = useState({
    pemeriksaanFisik: '',
    hasilTesting: '',
    masalahDitemukan: '',
    komponenBermasalah: '',
    tingkatKerusakan: 'ringan' as 'ringan' | 'sedang' | 'berat',
    dapatDiperbaiki: '' as 'ya' | 'tidak' | '',
  });

  // Tidak Dapat Diperbaiki Dialog
  const [showCannotRepairDialog, setShowCannotRepairDialog] = useState(false);
  const [cannotRepairForm, setCannotRepairForm] = useState({
    alasanTidakBisa: '',
    rekomendasiSolusi: '',
    estimasiBiayaBaruJikaDibeli: '',
    catatanTambahan: '',
  });

  // Mulai Perbaikan Dialog
  const [showStartRepairDialog, setShowStartRepairDialog] = useState(false);
  const [repairForm, setRepairForm] = useState({
    rencanaPerbaikan: '',
    estimasiWaktu: '',
    membutuhkanSparepart: false,
    daftarSparepart: [] as { nama: string; jumlah: number }[],
  });

  // Perbaikan Selesai Dialog
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    tindakanDilakukan: '',
    komponenDiganti: '',
    hasilPerbaikan: '',
    saranPerawatan: '',
    catatanTambahan: '',
    fotoBukti: '',
  });

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">Tiket tidak ditemukan</p>
        <Button onClick={onBack} className="mt-4">Kembali</Button>
      </div>
    );
  }

  const ticketOwner = users.find(u => u.id === ticket.userId);
  const assignedUser = ticket.assignedTo ? users.find(u => u.id === ticket.assignedTo) : null;

  // Get available technicians for assignment
  const technicians = users.filter(u => u.role === 'teknisi');

  // Calculate active repair tickets per technician
  const technicianActiveTickets = useMemo(() => {
    const activeStatuses: TicketStatus[] = [
      'assigned',
      'in_progress',
      'on_hold',
      'ditugaskan',
      'diterima_teknisi',
      'sedang_diagnosa',
      'dalam_perbaikan',
      'menunggu_sparepart'
    ];

    return technicians.reduce((acc, tech) => {
      const activeCount = tickets.filter(
        t => t.type === 'perbaikan' &&
             t.assignedTo === tech.id &&
             activeStatuses.includes(t.status)
      ).length;
      acc[tech.id] = activeCount;
      return acc;
    }, {} as Record<string, number>);
  }, [tickets, technicians]);

  // Check user permissions
  const canApprove = currentUser.role === 'admin_layanan' && ['menunggu_review', 'submitted'].includes(ticket.status);
  // Admin Layanan hanya bisa assign teknisi untuk tiket perbaikan SETELAH disetujui
  const canAssign = currentUser.role === 'admin_layanan' && 
                    ticket.type === 'perbaikan' && 
                    ticket.status === 'disetujui' &&
                    !ticket.assignedTo;
  const canComplete = currentUser.role === 'user' && ticket.userId === currentUser.id && 
                      ['resolved', 'selesai_diperbaiki', 'dalam_pengiriman'].includes(ticket.status);
  const canAcceptAsTeknisi = currentUser.role === 'teknisi' && ticket.assignedTo === currentUser.id && 
                             ['assigned', 'ditugaskan'].includes(ticket.status);
  const canTeknisiComplete = currentUser.role === 'teknisi' && ticket.assignedTo === currentUser.id && 
                             ['in_progress', 'diterima_teknisi', 'sedang_diagnosa', 'dalam_perbaikan'].includes(ticket.status);
  
  // Admin Penyedia permissions - removed permintaan_barang feature
  const canPenyediaApprove = false;
  const canPenyediaUpdateDelivery = false;

  const handleApprove = () => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        const newStatus: TicketStatus = t.type === 'perbaikan'
          ? 'disetujui'
          : 'approved';

        return {
          ...t,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'APPROVED',
              actor: currentUser.name,
              details: 'Tiket disetujui',
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: 'Tiket Disetujui',
      message: `Tiket ${ticket.ticketNumber} telah disetujui`,
      type: 'success',
      read: false,
    });

    toast.success('Tiket berhasil disetujui');
    setShowApproveDialog(false);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'ditolak' as TicketStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'REJECTED',
              actor: currentUser.name,
              details: `Tiket ditolak: ${rejectReason}`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: 'Tiket Ditolak',
      message: `Tiket ${ticket.ticketNumber} ditolak: ${rejectReason}`,
      type: 'error',
      read: false,
    });

    toast.success('Tiket berhasil ditolak');
    setShowRejectDialog(false);
    setRejectReason('');
  };



  const handleAssign = () => {
    if (!selectedTechnician) {
      toast.error('Pilih teknisi terlebih dahulu');
      return;
    }

    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'assigned' as TicketStatus,
          assignedTo: selectedTechnician,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'ASSIGNED',
              actor: currentUser.name,
              details: `Ditugaskan ke ${users.find(u => u.id === selectedTechnician)?.name}${assignNotes ? `: ${assignNotes}` : ''}`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify technician
    addNotification({
      userId: selectedTechnician,
      title: 'Tiket Baru Ditugaskan',
      message: `Anda ditugaskan untuk menangani tiket ${ticket.ticketNumber}`,
      type: 'info',
      read: false,
    });

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: 'Tiket Sedang Ditangani',
      message: `Tiket ${ticket.ticketNumber} sedang ditangani oleh teknisi`,
      type: 'info',
      read: false,
    });

    toast.success('Tiket berhasil ditugaskan');
    setShowAssignDialog(false);
    setSelectedTechnician('');
    setAssignNotes('');
  };

  const handleComplete = () => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'closed' as TicketStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'CLOSED',
              actor: currentUser.name,
              details: 'Tiket dikonfirmasi selesai oleh user',
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify assigned user if exists
    if (ticket.assignedTo) {
      addNotification({
        userId: ticket.assignedTo,
        title: 'Tiket Diselesaikan',
        message: `Tiket ${ticket.ticketNumber} telah dikonfirmasi selesai oleh user`,
        type: 'success',
        read: false,
      });
    }

    toast.success('Terima kasih atas konfirmasinya!');
    setShowCompleteDialog(false);
    onBack();
  };

  const handleAcceptAsTeknisi = () => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'diterima_teknisi' as TicketStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'ACCEPTED',
              actor: currentUser.name,
              details: 'Tiket diterima oleh teknisi',
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    addNotification({
      userId: ticket.userId,
      title: 'Tiket Diterima',
      message: `Tiket ${ticket.ticketNumber} sedang ditangani`,
      type: 'info',
      read: false,
    });

    toast.success('Tiket berhasil diterima');
  };

  const handleTeknisiComplete = () => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'selesai_diperbaiki' as TicketStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'COMPLETED_BY_TECHNICIAN',
              actor: currentUser.name,
              details: `Perbaikan selesai${completionNotes ? `: ${completionNotes}` : ''}`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: 'Perbaikan Selesai',
      message: `Tiket ${ticket.ticketNumber} telah selesai diperbaiki`,
      type: 'success',
      read: false,
    });

    toast.success('Tiket berhasil diselesaikan');
    setShowTeknisiCompleteDialog(false);
    setCompletionNotes('');
  };

  const handleCreateWorkOrder = () => {
    if (workOrderType === 'sparepart') {
      if (!sparepartName.trim() || !sparepartDescription.trim()) {
        toast.error('Nama dan deskripsi sparepart harus diisi');
        return;
      }
    } else {
      if (!sparepartDescription.trim()) {
        toast.error('Deskripsi vendor harus diisi');
        return;
      }
    }

    // Create work order
    const workOrder = createWorkOrder({
      ticketId: ticket.id,
      type: workOrderType,
      createdBy: currentUser.id,
      spareparts: workOrderType === 'sparepart' ? [{
        name: sparepartName,
        qty: 1,
        unit: 'unit',
        remarks: sparepartDescription,
      }] : undefined,
      vendorInfo: workOrderType === 'vendor' ? {
        description: sparepartDescription,
      } : undefined,
    });

    // Update ticket status to on_hold and add to timeline
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'on_hold' as TicketStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'WORK_ORDER_CREATED',
              actor: currentUser.name,
              details: `Work Order ${workOrderType === 'sparepart' ? 'Sparepart' : 'Vendor'} dibuat - ${sparepartName || 'Vendor Service'}`,
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);

    // Notify admin layanan
    const adminLayanan = users.filter(u => u.roles?.includes('admin_layanan') || u.role === 'admin_layanan');
    adminLayanan.forEach(admin => {
      addNotification({
        userId: admin.id,
        title: 'Work Order Baru',
        message: `${currentUser.name} membuat work order ${workOrderType} untuk tiket ${ticket.ticketNumber}`,
        type: 'info',
        read: false,
      });
    });

    // Notify admin penyedia
    const adminPenyedia = users.filter(u => u.roles?.includes('admin_penyedia') || u.role === 'admin_penyedia');
    adminPenyedia.forEach(admin => {
      addNotification({
        userId: admin.id,
        title: 'Work Order Baru',
        message: `Work Order ${workOrderType} untuk tiket ${ticket.ticketNumber}`,
        type: 'info',
        read: false,
      });
    });

    toast.success(`Work Order ${workOrderType} berhasil dibuat`);
    setShowSparepartDialog(false);
    setSparepartName('');
    setSparepartDescription('');
    setSparepartEstimatedPrice('');
    setSparepartUrgency('normal');
    setWorkOrderType('sparepart');
    setRefreshKey(prev => prev + 1);
  };

  const handleUpdateProgress = () => {
    // Validation: Notes required for "tidak_dapat_diperbaiki"
    if (newStatus === 'tidak_dapat_diperbaiki' && !progressNotes.trim()) {
      toast.error('Catatan wajib diisi untuk status "Tidak Dapat Diperbaiki"');
      return;
    }

    const statusLabels: Record<string, string> = {
      sedang_diagnosa: 'Sedang Diagnosa',
      dalam_perbaikan: 'Dalam Perbaikan',
      tidak_dapat_diperbaiki: 'Tidak Dapat Diperbaiki',
    };

    // Check if status is "tidak dapat diperbaiki"
    const isClosed = newStatus === 'tidak_dapat_diperbaiki';

    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: isClosed ? 'CLOSED' : 'STATUS_UPDATED',
              actor: currentUser.name,
              details: isClosed 
                ? `Tiket ditutup - Tidak dapat diperbaiki: ${progressNotes}`
                : `Status diubah ke ${statusLabels[newStatus]}${progressNotes ? `: ${progressNotes}` : ''}`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: isClosed ? 'Tiket Ditutup' : 'Update Progress Tiket',
      message: isClosed 
        ? `Tiket ${ticket.ticketNumber} tidak dapat diperbaiki`
        : `Tiket ${ticket.ticketNumber} - ${statusLabels[newStatus]}`,
      type: isClosed ? 'error' : 'info',
      read: false,
    });

    toast.success(isClosed ? 'Tiket berhasil ditutup' : 'Progress berhasil diupdate');
    setShowProgressDialog(false);
    setProgressNotes('');
    
    // Navigate back if ticket is closed
    if (isClosed) {
      setTimeout(() => onBack(), 1000);
    }
  };

  const handleAddComment = () => {
    if (!comment.trim()) {
      toast.error('Komentar tidak boleh kosong');
      return;
    }

    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'COMMENT',
              actor: currentUser.name,
              details: comment.trim(),
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);
    
    // Notify relevant parties about the comment
    const notificationMessage = `${currentUser.name} menambahkan komentar pada tiket ${ticket.ticketNumber}`;
    
    // Notify ticket owner if commenter is not the owner
    if (currentUser.id !== ticket.userId) {
      addNotification({
        userId: ticket.userId,
        title: 'Komentar Baru',
        message: notificationMessage,
        type: 'info',
        read: false,
      });
    }
    
    // Notify assigned technician if exists and not the commenter
    if (ticket.assignedTo && ticket.assignedTo !== currentUser.id) {
      addNotification({
        userId: ticket.assignedTo,
        title: 'Komentar Baru',
        message: notificationMessage,
        type: 'info',
        read: false,
      });
    }
    
    // Notify admin layanan if commenter is not admin
    if (currentUser.role !== 'admin_layanan') {
      const adminLayanan = users.filter(u => u.role === 'admin_layanan');
      adminLayanan.forEach(admin => {
        addNotification({
          userId: admin.id,
          title: 'Komentar Baru',
          message: notificationMessage,
          type: 'info',
          read: false,
        });
      });
    }

    toast.success('Komentar berhasil dikirim');
    setComment('');
    setRefreshKey(prev => prev + 1);
  };

  // Teknisi Accept Ticket
  const handleTeknisiAcceptTicket = () => {
    if (!estimatedSchedule) {
      toast.error('Estimasi jadwal harus diisi');
      return;
    }

    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'in_progress' as TicketStatus,
          updatedAt: new Date().toISOString(),
          data: {
            ...t.data,
            estimatedSchedule,
            acceptedByTeknisi: currentUser.name,
            acceptedAt: new Date().toISOString(),
          },
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'ACCEPTED_BY_TECHNICIAN',
              actor: currentUser.name,
              details: `Tiket diterima teknisi. Estimasi jadwal: ${estimatedSchedule}`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: 'Tiket Diterima Teknisi',
      message: `Teknisi ${currentUser.name} telah menerima tiket Anda. Estimasi penyelesaian: ${estimatedSchedule}`,
      type: 'info',
      read: false,
    });

    toast.success('Tiket berhasil diterima');
    setShowTeknisiAcceptDialog(false);
    setEstimatedSchedule('');
    setRefreshKey(prev => prev + 1);
  };

  // Teknisi Reject Ticket
  const handleTeknisiRejectTicket = () => {
    if (!teknisiRejectReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'submitted' as TicketStatus,
          assignedTo: undefined,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'REJECTED_BY_TECHNICIAN',
              actor: currentUser.name,
              details: `Tiket ditolak teknisi. Alasan: ${teknisiRejectReason}`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify admin layanan for re-assignment
    const adminLayanan = users.filter(u => u.role === 'admin_layanan');
    adminLayanan.forEach(admin => {
      addNotification({
        userId: admin.id,
        title: 'Tiket Ditolak Teknisi',
        message: `${currentUser.name} menolak tiket ${ticket.ticketNumber}. Perlu re-assign.`,
        type: 'warning',
        read: false,
      });
    });

    toast.success('Tiket telah ditolak. Admin Layanan akan melakukan re-assign.');
    setShowTeknisiRejectDialog(false);
    setTeknisiRejectReason('');
    setRefreshKey(prev => prev + 1);
  };

  // Teknisi Start Diagnosa
  const handleTeknisiStartDiagnosa = () => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'sedang_diagnosa' as TicketStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'DIAGNOSIS_STARTED',
              actor: currentUser.name,
              details: 'Mulai diagnosa barang',
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: 'Diagnosa Dimulai',
      message: `Teknisi ${currentUser.name} sedang melakukan diagnosa pada ${ticket.data?.itemName || 'barang Anda'}`,
      type: 'info',
      read: false,
    });

    toast.success('Status diubah ke Sedang Diagnosa');
    setRefreshKey(prev => prev + 1);
  };

  // Submit Diagnosa
  const handleSubmitDiagnosa = () => {
    if (!diagnosaForm.pemeriksaanFisik || !diagnosaForm.hasilTesting || !diagnosaForm.dapatDiperbaiki) {
      toast.error('Semua field diagnosa wajib diisi');
      return;
    }

    if (diagnosaForm.dapatDiperbaiki === 'tidak') {
      // Langsung ke form tidak dapat diperbaiki
      setShowDiagnosaDialog(false);
      setShowCannotRepairDialog(true);
    } else {
      // Lanjut ke form mulai perbaikan
      const updatedTickets = tickets.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            data: {
              ...t.data,
              diagnosa: diagnosaForm,
              diagnosedAt: new Date().toISOString(),
            },
            timeline: [
              ...t.timeline,
              {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                action: 'DIAGNOSIS_COMPLETED',
                actor: currentUser.name,
                details: `Diagnosa selesai. Hasil: ${diagnosaForm.dapatDiperbaiki === 'ya' ? 'Dapat diperbaiki' : 'Tidak dapat diperbaiki'}`,
              },
            ],
          };
        }
        return t;
      });

      saveTickets(updatedTickets);
      setShowDiagnosaDialog(false);
      setShowStartRepairDialog(true);
      setRefreshKey(prev => prev + 1);
    }
  };

  // Cannot Repair
  const handleCannotRepair = () => {
    if (!cannotRepairForm.alasanTidakBisa || !cannotRepairForm.rekomendasiSolusi) {
      toast.error('Alasan dan rekomendasi solusi harus diisi');
      return;
    }

    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'closed_unrepairable' as TicketStatus,
          updatedAt: new Date().toISOString(),
          data: {
            ...t.data,
            diagnosa: diagnosaForm,
            cannotRepairInfo: cannotRepairForm,
            completedAt: new Date().toISOString(),
            repairable: false,
          },
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'MARKED_CANNOT_REPAIR',
              actor: currentUser.name,
              details: `Barang tidak dapat diperbaiki. Alasan: ${cannotRepairForm.alasanTidakBisa}`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: 'Barang Tidak Dapat Diperbaiki',
      message: `Teknisi menyatakan ${ticket.data?.itemName || 'barang'} tidak dapat diperbaiki. Saran: ${cannotRepairForm.rekomendasiSolusi}`,
      type: 'warning',
      read: false,
    });

    // Notify admin layanan
    const adminLayanan = users.filter(u => u.role === 'admin_layanan');
    adminLayanan.forEach(admin => {
      addNotification({
        userId: admin.id,
        title: 'Barang Tidak Dapat Diperbaiki',
        message: `Tiket ${ticket.ticketNumber} - barang tidak dapat diperbaiki. Perlu tindakan lanjutan.`,
        type: 'warning',
        read: false,
      });
    });

    toast.success('Status diubah ke Tidak Dapat Diperbaiki');
    setShowCannotRepairDialog(false);
    setRefreshKey(prev => prev + 1);
  };

  // Start Repair
  const handleStartRepair = () => {
    if (!repairForm.rencanaPerbaikan || !repairForm.estimasiWaktu) {
      toast.error('Rencana perbaikan dan estimasi waktu harus diisi');
      return;
    }

    // Langsung mulai perbaikan
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'dalam_perbaikan' as TicketStatus,
          updatedAt: new Date().toISOString(),
          data: {
            ...t.data,
            repairPlan: repairForm,
            repairStartedAt: new Date().toISOString(),
          },
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'REPAIR_STARTED',
              actor: currentUser.name,
              details: `Mulai perbaikan. Estimasi waktu: ${repairForm.estimasiWaktu}`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: 'Perbaikan Dimulai',
      message: `Teknisi ${currentUser.name} telah mulai perbaikan. Estimasi waktu: ${repairForm.estimasiWaktu}`,
      type: 'info',
      read: false,
    });

    toast.success('Status diubah ke Dalam Perbaikan');
    setShowStartRepairDialog(false);
    setRefreshKey(prev => prev + 1);
  };

  // Complete Repair
  const handleCompleteRepair = () => {
    if (!completionForm.tindakanDilakukan || !completionForm.hasilPerbaikan) {
      toast.error('Tindakan yang dilakukan dan hasil perbaikan harus diisi');
      return;
    }

    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'resolved' as TicketStatus,
          updatedAt: new Date().toISOString(),
          data: {
            ...t.data,
            completionInfo: completionForm,
            completedAt: new Date().toISOString(),
            completedBy: currentUser.name,
          },
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'REPAIR_COMPLETED',
              actor: currentUser.name,
              details: `Perbaikan selesai. ${completionForm.hasilPerbaikan}`,
            },
            {
              id: (Date.now() + 1).toString(),
              timestamp: new Date().toISOString(),
              action: 'RESOLVED',
              actor: currentUser.name,
              details: 'Tiket resolved - menunggu konfirmasi user',
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: 'Perbaikan Selesai',
      message: `Teknisi ${currentUser.name} telah menyelesaikan perbaikan ${ticket.data?.itemName || 'barang Anda'}`,
      type: 'success',
      read: false,
    });

    // Notify admin layanan
    const adminLayanan = users.filter(u => u.role === 'admin_layanan');
    adminLayanan.forEach(admin => {
      addNotification({
        userId: admin.id,
        title: 'Perbaikan Selesai',
        message: `Tiket ${ticket.ticketNumber} telah diselesaikan oleh ${currentUser.name}`,
        type: 'success',
        read: false,
      });
    });

    toast.success('Perbaikan selesai! Tiket telah ditutup.');
    setShowCompletionDialog(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl">{ticket.title}</h1>
            <p className="text-gray-500 mt-1">#{ticket.ticketNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Layanan actions (Approve/Reject/Assign) are now in alert cards below for better UX */}

          {/* Teknisi actions are now handled by TeknisiWorkflow component below */}

          {canComplete && (
            <Button onClick={() => setShowCompleteDialog(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Konfirmasi Selesai
            </Button>
          )}

          {/* Admin Penyedia Actions */}
          {canPenyediaApprove && (
            <>
              <Button variant="outline" onClick={() => setShowPenyediaRejectDialog(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Tolak
              </Button>
              <Button onClick={() => setShowPenyediaApproveDialog(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Setujui Permintaan
              </Button>
            </>
          )}

          {canPenyediaUpdateDelivery && ticket.status !== 'menunggu_verifikasi_penyedia' && (
            <Button variant="secondary" onClick={() => setShowUpdateDeliveryDialog(true)}>
              <Truck className="h-4 w-4 mr-2" />
              Update Status Pengiriman
            </Button>
          )}
        </div>
      </div>

      {/* ============== ALERTS & NOTIFICATIONS FOR ADMIN LAYANAN ============== */}

      {/* Alert: Admin Layanan Review - For submitted tickets */}
      {currentUser.role === 'admin_layanan' && 
       ['submitted', 'menunggu_review'].includes(ticket.status) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-blue-900">Tiket Menunggu Review</h3>
                  <p className="text-sm text-blue-700">
                    {ticket.type === 'perbaikan' 
                      ? 'Review tiket perbaikan ini dan setujui atau tolak'
                      : 'Review permintaan Zoom Meeting ini dan setujui atau tolak'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-blue-300"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak
                </Button>
                <Button
                  onClick={() => {
                    if (ticket.type === 'zoom_meeting') {
                      setShowZoomReviewModal(true);
                    } else {
                      setShowApproveDialog(true);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Setujui
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert: Admin Layanan Assign - For approved repair tickets */}
      {currentUser.role === 'admin_layanan' && 
       ticket.type === 'perbaikan' &&
       ticket.status === 'disetujui' &&
       !ticket.assignedTo && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-green-900">Siap untuk Ditugaskan</h3>
                  <p className="text-sm text-green-700">Tiket sudah disetujui, silakan assign ke teknisi yang tersedia</p>
                </div>
              </div>
              <Button
                onClick={() => setShowAssignDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Assign ke Teknisi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============== ALERTS & NOTIFICATIONS FOR TEKNISI (ALWAYS ON TOP) ============== */}

      {/* Alert: Teknisi Accept/Reject - For newly assigned tickets */}
      {currentUser.role === 'teknisi' && 
       ticket.type === 'perbaikan' && 
       ticket.assignedTo === currentUser.id && 
       ['ditugaskan', 'assigned'].includes(ticket.status) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div>
                  <h3 className="text-orange-900">Tiket Baru Ditugaskan</h3>
                  <p className="text-sm text-orange-700">Terima atau tolak tugas perbaikan ini</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-orange-300"
                  onClick={() => setShowTeknisiRejectDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak
                </Button>
                <Button
                  onClick={() => setShowTeknisiAcceptDialog(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Terima Tiket
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert: Teknisi Start Diagnosa - For accepted tickets */}
      {currentUser.role === 'teknisi' && 
       ticket.type === 'perbaikan' && 
       ticket.assignedTo === currentUser.id && 
       ['diterima_teknisi', 'in_progress'].includes(ticket.status) && 
       ticket.status !== 'sedang_diagnosa' && 
       ticket.status !== 'dalam_perbaikan' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-blue-900">Tiket Diterima</h3>
                  <p className="text-sm text-blue-700">Mulai diagnosa barang untuk menentukan langkah perbaikan</p>
                </div>
              </div>
              <Button onClick={handleTeknisiStartDiagnosa} className="bg-blue-600 hover:bg-blue-700">
                <Wrench className="h-4 w-4 mr-2" />
                Mulai Diagnosa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert: Teknisi Fill Diagnosa Form - During diagnosa phase */}
      {currentUser.role === 'teknisi' && 
       ticket.type === 'perbaikan' && 
       ticket.assignedTo === currentUser.id && 
       ticket.status === 'sedang_diagnosa' && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="text-purple-900">Sedang Diagnosa</h3>
                  <p className="text-sm text-purple-700">Isi form hasil diagnosa dan tentukan apakah dapat diperbaiki</p>
                </div>
              </div>
              <Button onClick={() => setShowDiagnosaDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                <FileText className="h-4 w-4 mr-2" />
                Isi Form Diagnosa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert: Teknisi Complete Repair - During repair phase */}
      {currentUser.role === 'teknisi' && 
       ticket.type === 'perbaikan' && 
       ticket.assignedTo === currentUser.id && 
       ticket.status === 'dalam_perbaikan' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wrench className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-green-900">Dalam Perbaikan</h3>
                  <p className="text-sm text-green-700">Selesaikan perbaikan dan isi form penyelesaian</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-green-300"
                  onClick={() => setShowSparepartDialog(true)}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Request Work Order
                </Button>
                <Button onClick={() => setShowCompletionDialog(true)} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Perbaikan Selesai
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert: Teknisi Workflow - Menunggu Sparepart */}
      {currentUser.role === 'teknisi' && 
       ticket.type === 'perbaikan' && 
       ticket.assignedTo === currentUser.id && 
       !['ditugaskan', 'assigned'].includes(ticket.status) &&
       (ticket.status === 'menunggu_sparepart') && (
        <TeknisiWorkflow 
          ticket={ticket} 
          currentUser={currentUser}
          onUpdate={() => {
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}

      {/* Alert: Teknisi - On Hold (Menunggu Work Order) */}
      {currentUser.role === 'teknisi' && 
       ticket.type === 'perbaikan' && 
       ticket.assignedTo === currentUser.id && 
       ticket.status === 'on_hold' && (() => {
         const workOrders = getWorkOrdersByTicket(ticket.id);
         const pendingWO = workOrders.filter(wo => ['requested', 'in_procurement'].includes(wo.status));
         
         return (
           <Card className="border-yellow-200 bg-yellow-50">
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <Clock className="h-8 w-8 text-yellow-600" />
                   <div>
                     <h3 className="text-yellow-900">Menunggu Work Order</h3>
                     <p className="text-sm text-yellow-700">
                       {pendingWO.length} work order sedang diproses oleh Admin Penyedia
                     </p>
                   </div>
                 </div>
                 <Button
                   variant="outline"
                   className="border-yellow-300"
                   onClick={() => setShowSparepartDialog(true)}
                 >
                   <Package className="h-4 w-4 mr-2" />
                   Tambah Work Order
                 </Button>
               </div>
             </CardContent>
           </Card>
         );
       })()
      }

      {/* ============== TICKET DETAIL CARD ============== */}

      {/* Compact 2-Column Layout */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tiket #{ticket.ticketNumber}</p>
              <CardTitle className="text-xl">{ticket.title}</CardTitle>
            </div>
            <Badge variant={
              ['closed', 'selesai', 'approved', 'resolved'].includes(ticket.status) ? 'default' :
              ['closed_unrepairable', 'ditolak', 'rejected', 'dibatalkan'].includes(ticket.status) ? 'destructive' :
              'secondary'
            }>
              {ticket.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Ticket Information */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm mb-3">Informasi Tiket</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-32">Title:</span>
                    <span>{ticket.title}</span>
                  </div>
                  
                  {ticketOwner && (
                    <>
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-32">Pemohon:</span>
                        <span>{ticketOwner.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-32">Unit Kerja:</span>
                        <span>{ticketOwner.unitKerja}</span>
                      </div>
                    </>
                  )}
                  
                  {assignedUser && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-32">Teknisi:</span>
                      <span>{assignedUser.name}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-32">Priority:</span>
                    <Badge variant={
                      ticket.priority === 'P1' ? 'destructive' : 
                      ticket.priority === 'P2' ? 'default' : 
                      'secondary'
                    } className="w-fit">
                      {ticket.priority || 'Normal'}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-32">Dibuat:</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm mb-2">Deskripsi</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Informasi Tambahan untuk Tiket Perbaikan */}
              {ticket.type === 'perbaikan' && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm mb-3">Informasi Tambahan</h4>
                    <div className="space-y-2 text-sm">
                      {ticket.assetCode && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-32">Asset Code:</span>
                          <span>{ticket.assetCode}</span>
                        </div>
                      )}
                      {ticket.assetNUP && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-32">Asset N U P:</span>
                          <span>{ticket.assetNUP}</span>
                        </div>
                      )}
                      {ticket.assetLocation && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-32">Asset Location:</span>
                          <span>{ticket.assetLocation}</span>
                        </div>
                      )}
                      {ticket.data?.itemName && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-32">Item Name:</span>
                          <span>{ticket.data.itemName}</span>
                        </div>
                      )}
                      {ticket.attachments && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-32">Attachment Count:</span>
                          <span>{ticket.attachments.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Informasi Tambahan untuk Tiket Zoom */}
              {ticket.type === 'zoom_meeting' && ticket.data && Object.keys(ticket.data).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm mb-3">Informasi Tambahan</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(ticket.data).map(([key, value]) => {
                        // Custom rendering untuk zoomAccount di tiket Zoom yang approved
                        if (key === 'zoomAccount' && ticket.status === 'approved') {
                          const zoomAccount = ZOOM_PRO_ACCOUNTS.find(acc => acc.id === value);
                          return (
                            <React.Fragment key={key}>
                              <div className="flex gap-2">
                                <span className="text-gray-500 w-32">Akun Zoom:</span>
                                <span className="font-mono text-xs">
                                  {zoomAccount ? `${zoomAccount.name} (${zoomAccount.email})` : String(value)}
                                </span>
                              </div>
                              {zoomAccount && (
                                <div className="flex gap-2">
                                  <span className="text-gray-500 w-32">Host Key:</span>
                                  <span className="font-mono text-xs">{zoomAccount.hostKey}</span>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        }
                        
                        // Jangan tampilkan hostKey secara terpisah
                        if (key === 'hostKey') {
                          return null;
                        }
                        
                        if (typeof value === 'string' || typeof value === 'number') {
                          return (
                            <div key={key} className="flex gap-2">
                              <span className="text-gray-500 w-32 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span>{String(value)}</span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </>
              )}

              {ticket.attachments && ticket.attachments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm mb-2">File Terlampir</h4>
                    <div className="space-y-1">
                      {ticket.attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer">
                          <Paperclip className="h-3 w-3" />
                          <span>{att.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons - Compact */}
              <div className="flex flex-wrap gap-2 pt-4">
                {canAssign && (
                  <Button size="sm" onClick={() => setShowAssignDialog(true)}>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Assign Teknisi
                  </Button>
                )}
                {canComplete && (
                  <Button size="sm" onClick={() => setShowCompleteDialog(true)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Selesai
                  </Button>
                )}
              </div>
            </div>

            {/* Right Column - Work Orders & Discussion */}
            <div className="space-y-4">
              {/* Work Orders Section */}
              {ticket.type === 'perbaikan' && (() => {
                const workOrders = getWorkOrdersByTicket(ticket.id);
                if (workOrders.length === 0) return null;
                
                return (
                  <div>
                    <h4 className="text-sm mb-3 flex items-center gap-2">
                      <FolderKanban className="h-4 w-4" />
                      Work Orders ({workOrders.length})
                    </h4>
                    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                      {workOrders.map((wo) => (
                        <div key={wo.id} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {wo.type === 'sparepart' ? (
                                <Package className="h-4 w-4 text-purple-600" />
                              ) : (
                                <Truck className="h-4 w-4 text-orange-600" />
                              )}
                              <span className="text-sm font-medium">
                                {wo.type === 'sparepart' ? 'Sparepart' : 'Vendor'}
                              </span>
                            </div>
                            <Badge className={
                              wo.status === 'completed' || wo.status === 'delivered' 
                                ? 'bg-green-100 text-green-800' 
                                : wo.status === 'in_procurement'
                                ? 'bg-blue-100 text-blue-800'
                                : wo.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }>
                              {wo.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          {wo.type === 'sparepart' && wo.spareparts && (
                            <div className="text-xs text-gray-600 mt-1">
                              {wo.spareparts.map((sp, idx) => (
                                <div key={idx}>• {sp.name} ({sp.qty} {sp.unit})</div>
                              ))}
                            </div>
                          )}
                          {wo.type === 'vendor' && wo.vendorInfo?.description && (
                            <div className="text-xs text-gray-600 mt-1">
                              {wo.vendorInfo.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(wo.createdAt).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div>
                <h4 className="text-sm mb-3">Diskusi</h4>
                <ScrollArea className="h-[500px] border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-3">
                      {ticket.timeline && ticket.timeline.filter(e => e.action === 'COMMENT').length > 0 ? (
                        ticket.timeline.filter(e => e.action === 'COMMENT').map((event, index) => {
                          const isCurrentUser = event.actor === currentUser.name || event.actor === currentUser.id;
                          return (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={isCurrentUser ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                                  {formatActorName(event.actor).substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                                <div className={`inline-block max-w-[80%] ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2`}>
                                  <p className={`text-xs font-medium mb-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-600'}`}>
                                    {formatActorName(event.actor)}
                                  </p>
                                  <p className="text-sm whitespace-pre-wrap">{event.details}</p>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 px-1">
                                  {new Date(event.timestamp).toLocaleString('id-ID')}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>Belum ada percakapan</p>
                          <p className="text-xs mt-1">Mulai diskusi dengan mengirim komentar pertama</p>
                        </div>
                      )}
                    </div>
                </ScrollArea>
              </div>

              {/* Add Comment Form */}
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-xs">Tambah Komentar</Label>
                <Textarea
                  id="comment"
                  placeholder="Tulis komentar atau update..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
                <Button onClick={handleAddComment} disabled={!comment.trim()} size="sm" className="w-full">
                  <Send className="h-3 w-3 mr-2" />
                  Kirim Komentar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Tracker for User and Admin Layanan */}
      {(currentUser.id === ticket.userId || currentUser.role === 'admin_layanan') && ticket.type === 'perbaikan' && (
        <TicketProgressTracker ticket={ticket} />
      )}

      {/* ============== DIALOGS ============== */}

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Tiket</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menyetujui tiket ini? Tiket akan dilanjutkan ke tahap berikutnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Setujui</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Tiket</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan yang jelas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Alasan penolakan..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Tolak Tiket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign ke Teknisi</DialogTitle>
            <DialogDescription>
              Pilih teknisi yang akan menangani tiket ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Teknisi</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih teknisi" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map(tech => {
                    const activeCount = technicianActiveTickets[tech.id] || 0;
                    return (
                      <SelectItem key={tech.id} value={tech.id}>
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex flex-col">
                            <span>{tech.name}</span>
                            <span className="text-xs text-gray-500">{tech.unitKerja}</span>
                          </div>
                          <Badge 
                            variant={activeCount === 0 ? 'outline' : activeCount <= 2 ? 'secondary' : 'default'}
                            className="ml-2 shrink-0"
                          >
                            {activeCount} tiket aktif
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                placeholder="Catatan untuk teknisi..."
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAssign}>
              Assign Tiket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penyelesaian Tiket</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin tiket ini sudah selesai dan dapat ditutup?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              Ya, Konfirmasi Selesai
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Teknisi Complete Dialog */}
      <Dialog open={showTeknisiCompleteDialog} onOpenChange={setShowTeknisiCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selesaikan Tiket Perbaikan</DialogTitle>
            <DialogDescription>
              Konfirmasi bahwa perbaikan telah selesai
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Catatan Penyelesaian (Opsional)</Label>
              <Textarea
                placeholder="Jelaskan pekerjaan yang telah dilakukan..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={4}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ℹ️ Setelah Anda menyelesaikan tiket ini, status akan berubah menjadi "Selesai Diperbaiki" dan user akan diminta untuk konfirmasi.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeknisiCompleteDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleTeknisiComplete}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Selesaikan Tiket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Work Order Dialog */}
      <Dialog open={showSparepartDialog} onOpenChange={setShowSparepartDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Work Order</DialogTitle>
            <DialogDescription>
              Buat work order untuk sparepart atau vendor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipe Work Order <span className="text-red-500">*</span></Label>
              <RadioGroup value={workOrderType} onValueChange={(value) => setWorkOrderType(value as 'sparepart' | 'vendor')}>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="sparepart" id="wo-sparepart" />
                  <Label htmlFor="wo-sparepart" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <div>
                        <div>Sparepart</div>
                        <div className="text-xs text-gray-500">Permintaan komponen/suku cadang</div>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="vendor" id="wo-vendor" />
                  <Label htmlFor="wo-vendor" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-orange-600" />
                      <div>
                        <div>Vendor</div>
                        <div className="text-xs text-gray-500">Perbaikan oleh pihak ketiga</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {workOrderType === 'sparepart' && (
              <div className="space-y-2">
                <Label>Nama Sparepart <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Contoh: Toner Printer HP LaserJet"
                  value={sparepartName}
                  onChange={(e) => setSparepartName(e.target.value)}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>{workOrderType === 'sparepart' ? 'Deskripsi Detail' : 'Deskripsi Pekerjaan Vendor'} <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder={workOrderType === 'sparepart' ? 
                  "Jelaskan spesifikasi sparepart yang dibutuhkan..." :
                  "Jelaskan jenis pekerjaan yang perlu dilakukan vendor..."}
                value={sparepartDescription}
                onChange={(e) => setSparepartDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ℹ️ Tiket akan diubah statusnya menjadi "On Hold" dan work order akan diteruskan ke Admin Layanan dan Admin Penyedia.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSparepartDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateWorkOrder}>
              <Package className="h-4 w-4 mr-2" />
              Buat Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress Perbaikan</DialogTitle>
            <DialogDescription>
              Update status progress tiket perbaikan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status Progress</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as TicketStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedang_diagnosa">
                    🔍 Sedang Diagnosa
                  </SelectItem>
                  <SelectItem value="dalam_perbaikan">
                    🔧 Dalam Perbaikan
                  </SelectItem>
                  <SelectItem value="tidak_dapat_diperbaiki">
                    ❌ Tidak Dapat Diperbaiki
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catatan Progress {newStatus === 'tidak_dapat_diperbaiki' && <span className="text-red-500">*</span>}</Label>
              <Textarea
                placeholder={newStatus === 'tidak_dapat_diperbaiki' 
                  ? 'Jelaskan alasan mengapa tidak dapat diperbaiki...'
                  : 'Jelaskan progress yang telah dilakukan...'}
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                rows={3}
              />
            </div>

            {newStatus === 'tidak_dapat_diperbaiki' ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  ⚠️ <strong>Perhatian:</strong> Status ini akan menutup tiket secara permanen. User akan mendapat notifikasi bahwa barang tidak dapat diperbaiki.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ User akan mendapatkan notifikasi tentang update progress ini.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleUpdateProgress}
              variant={newStatus === 'tidak_dapat_diperbaiki' ? 'destructive' : 'default'}
            >
              {newStatus === 'tidak_dapat_diperbaiki' ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Tutup Tiket
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Update Progress
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teknisi Accept Dialog */}
      <Dialog open={showTeknisiAcceptDialog} onOpenChange={setShowTeknisiAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terima Tiket Perbaikan</DialogTitle>
            <DialogDescription>
              Konfirmasi bahwa Anda menerima tugas perbaikan ini dan berikan estimasi jadwal penyelesaian
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedSchedule">Estimasi Jadwal Penyelesaian *</Label>
              <Input
                id="estimatedSchedule"
                placeholder="Contoh: 2-3 hari kerja"
                value={estimatedSchedule}
                onChange={(e) => setEstimatedSchedule(e.target.value)}
              />
              <p className="text-xs text-gray-500">User akan menerima notifikasi dengan estimasi ini</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeknisiAcceptDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleTeknisiAcceptTicket}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Terima Tiket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teknisi Reject Dialog */}
      <AlertDialog open={showTeknisiRejectDialog} onOpenChange={setShowTeknisiRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Tiket Perbaikan</AlertDialogTitle>
            <AlertDialogDescription>
              Tiket ini akan dikembalikan ke Admin Layanan untuk di-assign ke teknisi lain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="teknisiRejectReason">Alasan Penolakan *</Label>
            <Textarea
              id="teknisiRejectReason"
              placeholder="Jelaskan mengapa Anda menolak tiket ini..."
              value={teknisiRejectReason}
              onChange={(e) => setTeknisiRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleTeknisiRejectTicket}>
              Tolak Tiket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diagnosa Dialog */}
      <Dialog open={showDiagnosaDialog} onOpenChange={setShowDiagnosaDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Diagnosa Barang</DialogTitle>
            <DialogDescription>
              Isi hasil pemeriksaan fisik dan testing untuk menentukan kondisi barang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pemeriksaanFisik">Hasil Pemeriksaan Fisik *</Label>
              <Textarea
                id="pemeriksaanFisik"
                placeholder="Deskripsi kondisi fisik barang, kerusakan yang terlihat, dll..."
                value={diagnosaForm.pemeriksaanFisik}
                onChange={(e) => setDiagnosaForm({ ...diagnosaForm, pemeriksaanFisik: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hasilTesting">Hasil Testing/Pengujian *</Label>
              <Textarea
                id="hasilTesting"
                placeholder="Hasil pengujian fungsi, performa, error yang muncul, dll..."
                value={diagnosaForm.hasilTesting}
                onChange={(e) => setDiagnosaForm({ ...diagnosaForm, hasilTesting: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="masalahDitemukan">Masalah yang Ditemukan *</Label>
              <Textarea
                id="masalahDitemukan"
                placeholder="Identifikasi masalah utama dari hasil pemeriksaan..."
                value={diagnosaForm.masalahDitemukan}
                onChange={(e) => setDiagnosaForm({ ...diagnosaForm, masalahDitemukan: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="komponenBermasalah">Komponen yang Bermasalah</Label>
              <Input
                id="komponenBermasalah"
                placeholder="Contoh: Motherboard, Hard Drive, Power Supply..."
                value={diagnosaForm.komponenBermasalah}
                onChange={(e) => setDiagnosaForm({ ...diagnosaForm, komponenBermasalah: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tingkat Kerusakan *</Label>
              <RadioGroup
                value={diagnosaForm.tingkatKerusakan}
                onValueChange={(value: any) => setDiagnosaForm({ ...diagnosaForm, tingkatKerusakan: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ringan" id="ringan" />
                  <Label htmlFor="ringan" className="font-normal cursor-pointer">
                    Ringan - Kerusakan minor yang mudah diperbaiki
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sedang" id="sedang" />
                  <Label htmlFor="sedang" className="font-normal cursor-pointer">
                    Sedang - Memerlukan perbaikan menyeluruh atau penggantian komponen
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="berat" id="berat" />
                  <Label htmlFor="berat" className="font-normal cursor-pointer">
                    Berat - Kerusakan parah yang sulit/tidak bisa diperbaiki
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Apakah Barang Dapat Diperbaiki? *</Label>
              <RadioGroup
                value={diagnosaForm.dapatDiperbaiki}
                onValueChange={(value: any) => setDiagnosaForm({ ...diagnosaForm, dapatDiperbaiki: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ya" id="ya" />
                  <Label htmlFor="ya" className="font-normal cursor-pointer">
                    <span className="text-green-600">✓ Ya, dapat diperbaiki</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tidak" id="tidak" />
                  <Label htmlFor="tidak" className="font-normal cursor-pointer">
                    <span className="text-red-600">✗ Tidak dapat diperbaiki</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {diagnosaForm.dapatDiperbaiki === 'tidak' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Setelah submit, Anda akan diminta mengisi form konfirmasi barang tidak dapat diperbaiki
                  dan memberikan saran solusi kepada user.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiagnosaDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmitDiagnosa}>
              Submit Diagnosa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cannot Repair Dialog */}
      <Dialog open={showCannotRepairDialog} onOpenChange={setShowCannotRepairDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Konfirmasi Barang Tidak Dapat Diperbaiki</DialogTitle>
            <DialogDescription>
              Isi informasi detail dan berikan rekomendasi solusi kepada user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                User akan menerima notifikasi bahwa barang tidak dapat diperbaiki beserta saran Anda.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="alasanTidakBisa">Alasan Tidak Dapat Diperbaiki *</Label>
              <Textarea
                id="alasanTidakBisa"
                placeholder="Jelaskan secara detail mengapa barang tidak dapat diperbaiki..."
                value={cannotRepairForm.alasanTidakBisa}
                onChange={(e) => setCannotRepairForm({ ...cannotRepairForm, alasanTidakBisa: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rekomendasiSolusi">Rekomendasi Solusi *</Label>
              <Textarea
                id="rekomendasiSolusi"
                placeholder="Saran solusi: pengajuan barang baru, alternatif lain, dll..."
                value={cannotRepairForm.rekomendasiSolusi}
                onChange={(e) => setCannotRepairForm({ ...cannotRepairForm, rekomendasiSolusi: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimasiBiaya">Estimasi Biaya Barang Baru (Opsional)</Label>
              <Input
                id="estimasiBiaya"
                placeholder="Rp. 0"
                value={cannotRepairForm.estimasiBiayaBaruJikaDibeli}
                onChange={(e) => setCannotRepairForm({ ...cannotRepairForm, estimasiBiayaBaruJikaDibeli: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatanTambahan">Catatan Tambahan (Opsional)</Label>
              <Textarea
                id="catatanTambahan"
                placeholder="Informasi tambahan yang perlu diketahui..."
                value={cannotRepairForm.catatanTambahan}
                onChange={(e) => setCannotRepairForm({ ...cannotRepairForm, catatanTambahan: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCannotRepairDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleCannotRepair} variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Konfirmasi Tidak Dapat Diperbaiki
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Repair Dialog */}
      <Dialog open={showStartRepairDialog} onOpenChange={setShowStartRepairDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mulai Perbaikan</DialogTitle>
            <DialogDescription>
              Buat rencana perbaikan dan estimasi waktu penyelesaian
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Barang dapat diperbaiki. Silakan buat rencana perbaikan.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="rencanaPerbaikan">Rencana Perbaikan *</Label>
              <Textarea
                id="rencanaPerbaikan"
                placeholder="Jelaskan langkah-langkah perbaikan yang akan dilakukan..."
                value={repairForm.rencanaPerbaikan}
                onChange={(e) => setRepairForm({ ...repairForm, rencanaPerbaikan: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimasiWaktu">Estimasi Waktu Penyelesaian *</Label>
              <Input
                id="estimasiWaktu"
                placeholder="Contoh: 2-3 hari kerja"
                value={repairForm.estimasiWaktu}
                onChange={(e) => setRepairForm({ ...repairForm, estimasiWaktu: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartRepairDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleStartRepair}>
              <Wrench className="h-4 w-4 mr-2" />
              Mulai Perbaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Penyelesaian Perbaikan</DialogTitle>
            <DialogDescription>
              Dokumentasikan hasil perbaikan dan berikan saran perawatan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tindakanDilakukan">Tindakan yang Dilakukan *</Label>
              <Textarea
                id="tindakanDilakukan"
                placeholder="Jelaskan langkah perbaikan yang telah dilakukan..."
                value={completionForm.tindakanDilakukan}
                onChange={(e) => setCompletionForm({ ...completionForm, tindakanDilakukan: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="komponenDiganti">Komponen yang Diganti/Diperbaiki</Label>
              <Input
                id="komponenDiganti"
                placeholder="Daftar komponen yang diganti atau diperbaiki..."
                value={completionForm.komponenDiganti}
                onChange={(e) => setCompletionForm({ ...completionForm, komponenDiganti: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hasilPerbaikan">Hasil Perbaikan *</Label>
              <Textarea
                id="hasilPerbaikan"
                placeholder="Kondisi barang setelah perbaikan, fungsi yang sudah normal, dll..."
                value={completionForm.hasilPerbaikan}
                onChange={(e) => setCompletionForm({ ...completionForm, hasilPerbaikan: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saranPerawatan">Saran Perawatan</Label>
              <Textarea
                id="saranPerawatan"
                placeholder="Saran untuk merawat barang agar tidak rusak lagi..."
                value={completionForm.saranPerawatan}
                onChange={(e) => setCompletionForm({ ...completionForm, saranPerawatan: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatanTambahanCompletion">Catatan Tambahan</Label>
              <Textarea
                id="catatanTambahanCompletion"
                placeholder="Catatan tambahan yang perlu diketahui user..."
                value={completionForm.catatanTambahan}
                onChange={(e) => setCompletionForm({ ...completionForm, catatanTambahan: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fotoBukti">Link Foto Bukti Perbaikan (Opsional)</Label>
              <Input
                id="fotoBukti"
                placeholder="URL foto atau dokumentasi..."
                value={completionForm.fotoBukti}
                onChange={(e) => setCompletionForm({ ...completionForm, fotoBukti: e.target.value })}
              />
            </div>

            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Setelah submit, tiket akan otomatis ditutup dan user akan menerima notifikasi bahwa perbaikan selesai.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletionDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleCompleteRepair} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Selesaikan Perbaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zoom Admin Review Modal */}
      {showZoomReviewModal && ticket.type === 'zoom_meeting' && (
        <ZoomAdminReviewModal
          booking={ticket}
          onClose={() => setShowZoomReviewModal(false)}
          onUpdate={() => {
            setShowZoomReviewModal(false);
            setRefreshKey(prev => prev + 1); // Force re-render to get updated data
          }}
        />
      )}
    </motion.div>
  );
};