import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Alert, AlertDescription } from './ui/alert';
import { TicketProgressTracker } from './ticket-progress-tracker';
import { TicketProgressTrackerZoom } from './ticket-progress-tracker-zoom';
import { TeknisiWorkflow } from './teknisi-workflow-new';
import { ZoomAdminReviewModal } from './zoom-admin-review-modal';
import {
  Dialog,
  DialogContent,
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { AlertCircle } from 'lucide-react';
import type { User } from '../types';
type TicketStatus = any;
import { motion } from 'motion/react';
import { Spinner } from './ui/spinner';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { getTickets, saveTickets, getUsersSync, addNotification, createWorkOrder, getWorkOrdersByTicket } from '../lib/storage';
import type { ViewType } from './main-layout';
import { TicketDetailHeader, TicketDetailInfo } from './ticket-detail-info';
import { TicketDetailAlerts } from './ticket-detail-alerts';
import { formatActorName } from './ticket-detail-utils';
import { useTicketComments } from '../hooks/useTicketComments';
import {
  useAdminLayananDialogs,
  useTeknisiDialogs,
  useDiagnosaDialogs,
  useWorkOrderDialogs,
  useProgressDialog,
  useCommentState,
  useZoomReviewModal,
} from './ticket-detail-hooks';

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
}) => {
  // === ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS ===
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [ticketDetail, setTicketDetail] = React.useState<any>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(true);
  const tickets = useMemo(() => getTickets(), [refreshKey]);
  const users = getUsersSync();
  
  // Import state dari custom hooks
  const adminDialogs = useAdminLayananDialogs();
  const tekDialogs = useTeknisiDialogs();
  const diagnosaDialog = useDiagnosaDialogs();
  const workOrderDialog = useWorkOrderDialogs();
  const progressDialog = useProgressDialog();
  const { comment, setComment } = useCommentState();
  const { showZoomReviewModal, setShowZoomReviewModal } = useZoomReviewModal();
  const { comments, loading: commentsLoading, hasMore, fetchComments, loadMoreComments, addComment } = useTicketComments();

  // Fetch full ticket detail from backend
  React.useEffect(() => {
    const fetchTicketDetail = async () => {
      setLoadingDetail(true);
      try {
        const response = await api.get<any>(`tickets/${ticketId}`);
        const ticketData = response.data || response;
        setTicketDetail(ticketData);
        console.log('📝 Ticket Detail fetched:', ticketData);
      } catch (error) {
        console.error('Failed to fetch ticket detail:', error);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchTicketDetail();
  }, [ticketId, refreshKey]);

  // Fetch comments saat component mount
  React.useEffect(() => {
    fetchComments(ticketId);
  }, [ticketId, fetchComments]);

  const ticket = ticketDetail || tickets.find(t => t.id === ticketId);

  // === COMPUTED VALUES (useMemo must be before conditional returns) ===
  const technicians = useMemo(() => users.filter(u => u.role === 'teknisi'), [users]);
  
  const technicianActiveTickets = useMemo(() => {
    const activeStatuses: TicketStatus[] = [
      'assigned', 'in_progress', 'on_hold', 'ditugaskan', 'diterima_teknisi',
      'sedang_diagnosa', 'dalam_perbaikan', 'menunggu_sparepart'
    ];
    return technicians.reduce((acc, tech) => {
      const activeCount = tickets.filter(
        t => t.type === 'perbaikan' && t.assignedTo === tech.id && activeStatuses.includes(t.status)
      ).length;
      acc[tech.id] = activeCount;
      return acc;
    }, {} as Record<string, number>);
  }, [tickets, technicians]);

  // === EARLY RETURN IF TICKET NOT FOUND (AFTER ALL HOOKS) ===
  if (loadingDetail) {
    return (
      <div className="text-center py-12">
        <Spinner className="h-16 w-16 mx-auto mb-4 text-blue-500" />
        <p className="text-gray-500">Memuat detail tiket...</p>
      </div>
    );
  }
  
  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">Tiket tidak ditemukan</p>
        <Button onClick={onBack} className="mt-4">Kembali</Button>
      </div>
    );
  }

  // === DERIVED VALUES (after ticket is confirmed to exist) ===
  const ticketOwner = users.find(u => u.id === ticket.userId);
  // Use assignedUser from backend if available, otherwise find from users array
  const assignedUser = ticket.assignedTo ? users.find(u => u.id === ticket.assignedTo) : null;

  // === PERMISSION CHECKS ===
  const canComplete = currentUser.role === 'pegawai' && ticket.userId === currentUser.id && ['resolved', 'selesai_diperbaiki', 'dalam_pengiriman'].includes(ticket.status as any);

  // === HANDLERS (KEPT INLINE) ===
  const handleApprove = () => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        const newStatus: TicketStatus = t.type === 'perbaikan' ? 'disetujui' : 'approved';
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
    addNotification({
      userId: ticket.userId,
      title: 'Tiket Disetujui',
      message: `Tiket ${ticket.ticketNumber} telah disetujui`,
      type: 'success',
      read: false,
    });
    toast.success('Tiket berhasil disetujui');
    adminDialogs.setShowApproveDialog(false);
  };

  const handleReject = async () => {
    if (!adminDialogs.rejectReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    try {
      // Gunakan endpoint yang sesuai berdasarkan tipe tiket
      const endpoint = ticket.type === 'zoom_meeting' 
        ? `tickets/${ticketId}/reject-zoom`
        : `tickets/${ticketId}/reject`;

      await api.patch(endpoint, {
        reason: adminDialogs.rejectReason,
      });

      toast.success('Tiket berhasil ditolak');
      adminDialogs.setShowRejectDialog(false);
      adminDialogs.setRejectReason('');
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error('Failed to reject ticket:', error);
      const errorMsg = error?.body?.message || 'Gagal menolak tiket';
      toast.error(errorMsg);
    }
  };

  const handleAssign = () => {
    if (!adminDialogs.selectedTechnician) {
      toast.error('Pilih teknisi terlebih dahulu');
      return;
    }
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'assigned' as TicketStatus,
          assignedTo: adminDialogs.selectedTechnician,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'ASSIGNED',
              actor: currentUser.name,
              details: `Ditugaskan ke ${users.find(u => u.id === adminDialogs.selectedTechnician)?.name}`,
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    addNotification({
      userId: adminDialogs.selectedTechnician,
      title: 'Tiket Baru Ditugaskan',
      message: `Anda ditugaskan untuk menangani tiket ${ticket.ticketNumber}`,
      type: 'info',
      read: false,
    });
    addNotification({
      userId: ticket.userId,
      title: 'Tiket Sedang Ditangani',
      message: `Tiket ${ticket.ticketNumber} sedang ditangani oleh teknisi`,
      type: 'info',
      read: false,
    });
    toast.success('Tiket berhasil ditugaskan');
    adminDialogs.setShowAssignDialog(false);
    adminDialogs.setSelectedTechnician('');
    adminDialogs.setAssignNotes('');
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
    onBack();
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error('Komentar tidak boleh kosong');
      return;
    }
    try {
      await addComment(ticketId, comment);
      toast.success('Komentar berhasil dikirim');
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Gagal mengirim komentar');
    }
  };

  // === TEKNISI HANDLERS ===
  const handleTeknisiAcceptTicket = () => {
    if (!tekDialogs.estimatedSchedule) {
      toast.error('Estimasi jadwal harus diisi');
      return;
    }
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
              details: `Tiket diterima. Estimasi: ${tekDialogs.estimatedSchedule}`,
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    addNotification({
      userId: ticket.userId,
      title: 'Tiket Diterima Teknisi',
      message: `Teknisi ${currentUser.name} telah menerima tiket Anda. Estimasi: ${tekDialogs.estimatedSchedule}`,
      type: 'info',
      read: false,
    });
    toast.success('Tiket berhasil diterima');
    tekDialogs.setShowTeknisiAcceptDialog(false);
    tekDialogs.setEstimatedSchedule('');
    setRefreshKey(prev => prev + 1);
  };

  const handleTeknisiRejectTicket = () => {
    if (!tekDialogs.teknisiRejectReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'rejected' as TicketStatus,
          assignedTo: undefined,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'REJECTED',
              actor: currentUser.name,
              details: `Tiket ditolak: ${tekDialogs.teknisiRejectReason}`,
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    const adminLayanan = users.filter(u => u.role === 'admin_layanan');
    adminLayanan.forEach(admin => {
      addNotification({
        userId: admin.id,
        title: 'Tiket Ditolak Teknisi',
        message: `${currentUser.name} menolak tiket ${ticket.ticketNumber}`,
        type: 'warning',
        read: false,
      });
    });
    toast.success('Tiket telah ditolak');
    tekDialogs.setShowTeknisiRejectDialog(false);
    tekDialogs.setTeknisiRejectReason('');
    setRefreshKey(prev => prev + 1);
  };

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
              action: 'STATUS_UPDATE',
              actor: currentUser.name,
              details: 'Memulai diagnosa',
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    addNotification({
      userId: ticket.userId,
      title: 'Diagnosa Dimulai',
      message: `Teknisi sedang melakukan diagnosa`,
      type: 'info',
      read: false,
    });
    toast.success('Status diubah ke Sedang Diagnosa');
    setRefreshKey(prev => prev + 1);
  };

  const handleSubmitDiagnosa = () => {
    if (!diagnosaDialog.diagnosaForm.pemeriksaanFisik || !diagnosaDialog.diagnosaForm.hasilTesting || !diagnosaDialog.diagnosaForm.dapatDiperbaiki) {
      toast.error('Semua field diagnosa wajib diisi');
      return;
    }
    if (diagnosaDialog.diagnosaForm.dapatDiperbaiki === 'tidak') {
      diagnosaDialog.setShowDiagnosaDialog(false);
      diagnosaDialog.setShowCannotRepairDialog(true);
    } else {
      diagnosaDialog.setShowDiagnosaDialog(false);
      diagnosaDialog.setShowStartRepairDialog(true);
    }
  };

  const handleCannotRepair = () => {
    if (!diagnosaDialog.cannotRepairForm.alasanTidakBisa || !diagnosaDialog.cannotRepairForm.rekomendasiSolusi) {
      toast.error('Alasan dan rekomendasi solusi harus diisi');
      return;
    }
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'tidak_dapat_diperbaiki' as TicketStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'STATUS_UPDATE',
              actor: currentUser.name,
              details: `Barang tidak dapat diperbaiki: ${diagnosaDialog.cannotRepairForm.alasanTidakBisa}`,
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    addNotification({
      userId: ticket.userId,
      title: 'Barang Tidak Dapat Diperbaiki',
      message: `Saran: ${diagnosaDialog.cannotRepairForm.rekomendasiSolusi}`,
      type: 'warning',
      read: false,
    });
    toast.success('Status diubah ke Tidak Dapat Diperbaiki');
    diagnosaDialog.setShowCannotRepairDialog(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleStartRepair = () => {
    if (!diagnosaDialog.repairForm.rencanaPerbaikan || !diagnosaDialog.repairForm.estimasiWaktu) {
      toast.error('Rencana perbaikan dan estimasi waktu harus diisi');
      return;
    }
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'dalam_perbaikan' as TicketStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'STATUS_UPDATE',
              actor: currentUser.name,
              details: `Memulai perbaikan. Estimasi: ${diagnosaDialog.repairForm.estimasiWaktu}`,
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    addNotification({
      userId: ticket.userId,
      title: 'Perbaikan Dimulai',
      message: `Estimasi waktu: ${diagnosaDialog.repairForm.estimasiWaktu}`,
      type: 'info',
      read: false,
    });
    toast.success('Status diubah ke Dalam Perbaikan');
    diagnosaDialog.setShowStartRepairDialog(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleCompleteRepair = () => {
    if (!diagnosaDialog.completionForm.tindakanDilakukan || !diagnosaDialog.completionForm.hasilPerbaikan) {
      toast.error('Tindakan dan hasil perbaikan harus diisi');
      return;
    }
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
              action: 'STATUS_UPDATE',
              actor: currentUser.name,
              details: `Perbaikan selesai: ${diagnosaDialog.completionForm.hasilPerbaikan}`,
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    addNotification({
      userId: ticket.userId,
      title: 'Perbaikan Selesai',
      message: `Perbaikan telah diselesaikan`,
      type: 'success',
      read: false,
    });
    toast.success('Perbaikan selesai!');
    diagnosaDialog.setShowCompletionDialog(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleCreateWorkOrder = () => {
    if (workOrderDialog.workOrderType === 'sparepart') {
      if (!workOrderDialog.sparepartName.trim() || !workOrderDialog.sparepartDescription.trim()) {
        toast.error('Nama sparepart dan deskripsi harus diisi');
        return;
      }
    } else {
      if (!workOrderDialog.sparepartDescription.trim()) {
        toast.error('Deskripsi pekerjaan harus diisi');
        return;
      }
    }
    createWorkOrder({
      ticketId: ticket.id,
      type: workOrderDialog.workOrderType,
      createdBy: currentUser.id,
      spareparts: workOrderDialog.workOrderType === 'sparepart' ? [{
        name: workOrderDialog.sparepartName,
        quantity: 1,
        unit: 'unit',
        remarks: workOrderDialog.sparepartDescription,
      }] : undefined,
      vendorInfo: workOrderDialog.workOrderType === 'vendor' ? {
        description: workOrderDialog.sparepartDescription,
      } : undefined,
    });
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
              details: `Work order ${workOrderDialog.workOrderType} dibuat`,
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    const adminLayanan = users.filter(u => u.role === 'admin_layanan');
    adminLayanan.forEach(admin => {
      addNotification({
        userId: admin.id,
        title: 'Work Order Baru',
        message: `Work order ${workOrderDialog.workOrderType} untuk tiket ${ticket.ticketNumber}`,
        type: 'info',
        read: false,
      });
    });
    toast.success(`Work Order berhasil dibuat`);
    workOrderDialog.setShowSparepartDialog(false);
    workOrderDialog.setSparepartName('');
    workOrderDialog.setSparepartDescription('');
    setRefreshKey(prev => prev + 1);
  };

  const handleUpdateProgress = () => {
    if (progressDialog.newStatus === 'tidak_dapat_diperbaiki' && !progressDialog.progressNotes.trim()) {
      toast.error('Catatan wajib diisi');
      return;
    }
    const isClosed = progressDialog.newStatus === 'tidak_dapat_diperbaiki';
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: progressDialog.newStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'STATUS_UPDATE',
              actor: currentUser.name,
              details: progressDialog.progressNotes,
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    addNotification({
      userId: ticket.userId,
      title: isClosed ? 'Tiket Ditutup' : 'Progress Update',
      message: progressDialog.progressNotes,
      type: isClosed ? 'error' : 'info',
      read: false,
    });
    toast.success(isClosed ? 'Tiket ditutup' : 'Progress updated');
    progressDialog.setShowProgressDialog(false);
    progressDialog.setProgressNotes('');
    if (isClosed) setTimeout(() => onBack(), 1000);
  };

  // === RENDER ===
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <TicketDetailHeader
        ticket={ticket}
        currentUser={currentUser}
        canComplete={canComplete}
        onBack={onBack}
        onShowCompleteDialog={() => {}}
      />

      {/* Alerts */}
      <TicketDetailAlerts
        ticket={ticket}
        currentUser={currentUser}
        onShowReviewDialog={() => adminDialogs.setShowApproveDialog(true)}
        onShowRejectDialog={() => adminDialogs.setShowRejectDialog(true)}
        onShowAssignDialog={() => adminDialogs.setShowAssignDialog(true)}
        onShowTeknisiAcceptDialog={() => tekDialogs.setShowTeknisiAcceptDialog(true)}
        onShowTeknisiRejectDialog={() => tekDialogs.setShowTeknisiRejectDialog(true)}
        onShowTeknisiStartDiagnosa={handleTeknisiStartDiagnosa}
        onShowDiagnosaDialog={() => diagnosaDialog.setShowDiagnosaDialog(true)}
        onShowCompletionDialog={() => diagnosaDialog.setShowCompletionDialog(true)}
        onShowSparepartDialog={() => workOrderDialog.setShowSparepartDialog(true)}
        getWorkOrdersByTicket={getWorkOrdersByTicket}
      />

      {/* Info */}
      <TicketDetailInfo
        ticket={ticket}
        ticketOwner={ticketOwner}
        assignedUser={assignedUser || undefined}
        comment={comment}
        onCommentChange={setComment}
        onAddComment={handleAddComment}
        getWorkOrdersByTicket={getWorkOrdersByTicket}
        comments={comments}
        commentsLoading={commentsLoading}
        hasMore={hasMore}
        onLoadMoreComments={() => loadMoreComments(ticketId)}
      />

      {/* Progress Tracker */}
      {ticket.type === 'perbaikan' && <TicketProgressTracker ticket={ticket} />}
      {ticket.type === 'zoom_meeting' && <TicketProgressTrackerZoom ticket={ticket} />}

      {/* Teknisi Workflow */}
      {currentUser.role === 'teknisi' && ticket.type === 'perbaikan' && ticket.assignedTo === currentUser.id && (ticket.status as any) === 'menunggu_sparepart' && (
        <TeknisiWorkflow 
          ticket={ticket} 
          currentUser={currentUser}
          onUpdate={() => setRefreshKey(prev => prev + 1)}
        />
      )}

      {/* ============== DIALOGS ============== */}

      {/* Approve */}
      <AlertDialog open={adminDialogs.showApproveDialog} onOpenChange={adminDialogs.setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Tiket</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Setujui</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject */}
      <Dialog open={adminDialogs.showRejectDialog} onOpenChange={adminDialogs.setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Tiket</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Alasan penolakan..."
            value={adminDialogs.rejectReason}
            onChange={(e) => adminDialogs.setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => adminDialogs.setShowRejectDialog(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleReject}>Tolak</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign */}
      <Dialog open={adminDialogs.showAssignDialog} onOpenChange={adminDialogs.setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign ke Teknisi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={adminDialogs.selectedTechnician} onValueChange={adminDialogs.setSelectedTechnician}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih teknisi" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map(tech => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name} ({technicianActiveTickets[tech.id] || 0} aktif)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Catatan..."
              value={adminDialogs.assignNotes}
              onChange={(e) => adminDialogs.setAssignNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => adminDialogs.setShowAssignDialog(false)}>Batal</Button>
            <Button onClick={handleAssign}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teknisi Accept */}
      <Dialog open={tekDialogs.showTeknisiAcceptDialog} onOpenChange={tekDialogs.setShowTeknisiAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terima Tiket</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Estimasi jadwal..."
            value={tekDialogs.estimatedSchedule}
            onChange={(e) => tekDialogs.setEstimatedSchedule(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => tekDialogs.setShowTeknisiAcceptDialog(false)}>Batal</Button>
            <Button onClick={handleTeknisiAcceptTicket}>Terima</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teknisi Reject */}
      <AlertDialog open={tekDialogs.showTeknisiRejectDialog} onOpenChange={tekDialogs.setShowTeknisiRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Tiket</AlertDialogTitle>
          </AlertDialogHeader>
          <Textarea
            placeholder="Alasan..."
            value={tekDialogs.teknisiRejectReason}
            onChange={(e) => tekDialogs.setTeknisiRejectReason(e.target.value)}
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleTeknisiRejectTicket}>Tolak</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diagnosa */}
      <Dialog open={diagnosaDialog.showDiagnosaDialog} onOpenChange={diagnosaDialog.setShowDiagnosaDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Form Diagnosa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Pemeriksaan fisik..."
              value={diagnosaDialog.diagnosaForm.pemeriksaanFisik}
              onChange={(e) => diagnosaDialog.setDiagnosaForm({ ...diagnosaDialog.diagnosaForm, pemeriksaanFisik: e.target.value })}
              rows={3}
            />
            <Textarea
              placeholder="Hasil testing..."
              value={diagnosaDialog.diagnosaForm.hasilTesting}
              onChange={(e) => diagnosaDialog.setDiagnosaForm({ ...diagnosaDialog.diagnosaForm, hasilTesting: e.target.value })}
              rows={3}
            />
            <div>
              <Label>Dapat diperbaiki?</Label>
              <RadioGroup value={diagnosaDialog.diagnosaForm.dapatDiperbaiki} onValueChange={(val) => diagnosaDialog.setDiagnosaForm({ ...diagnosaDialog.diagnosaForm, dapatDiperbaiki: val as any })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ya" id="ya" />
                  <Label htmlFor="ya">Ya</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tidak" id="tidak" />
                  <Label htmlFor="tidak">Tidak</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => diagnosaDialog.setShowDiagnosaDialog(false)}>Batal</Button>
            <Button onClick={handleSubmitDiagnosa}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cannot Repair */}
      <Dialog open={diagnosaDialog.showCannotRepairDialog} onOpenChange={diagnosaDialog.setShowCannotRepairDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tidak Dapat Diperbaiki</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="Alasan..." value={diagnosaDialog.cannotRepairForm.alasanTidakBisa} onChange={(e) => diagnosaDialog.setCannotRepairForm({ ...diagnosaDialog.cannotRepairForm, alasanTidakBisa: e.target.value })} rows={3} />
            <Textarea placeholder="Rekomendasi..." value={diagnosaDialog.cannotRepairForm.rekomendasiSolusi} onChange={(e) => diagnosaDialog.setCannotRepairForm({ ...diagnosaDialog.cannotRepairForm, rekomendasiSolusi: e.target.value })} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => diagnosaDialog.setShowCannotRepairDialog(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleCannotRepair}>Konfirmasi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Repair */}
      <Dialog open={diagnosaDialog.showStartRepairDialog} onOpenChange={diagnosaDialog.setShowStartRepairDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mulai Perbaikan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="Rencana perbaikan..." value={diagnosaDialog.repairForm.rencanaPerbaikan} onChange={(e) => diagnosaDialog.setRepairForm({ ...diagnosaDialog.repairForm, rencanaPerbaikan: e.target.value })} rows={3} />
            <Input placeholder="Estimasi waktu..." value={diagnosaDialog.repairForm.estimasiWaktu} onChange={(e) => diagnosaDialog.setRepairForm({ ...diagnosaDialog.repairForm, estimasiWaktu: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => diagnosaDialog.setShowStartRepairDialog(false)}>Batal</Button>
            <Button onClick={handleStartRepair}>Mulai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion */}
      <Dialog open={diagnosaDialog.showCompletionDialog} onOpenChange={diagnosaDialog.setShowCompletionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Penyelesaian Perbaikan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="Tindakan..." value={diagnosaDialog.completionForm.tindakanDilakukan} onChange={(e) => diagnosaDialog.setCompletionForm({ ...diagnosaDialog.completionForm, tindakanDilakukan: e.target.value })} rows={3} />
            <Textarea placeholder="Hasil..." value={diagnosaDialog.completionForm.hasilPerbaikan} onChange={(e) => diagnosaDialog.setCompletionForm({ ...diagnosaDialog.completionForm, hasilPerbaikan: e.target.value })} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => diagnosaDialog.setShowCompletionDialog(false)}>Batal</Button>
            <Button onClick={handleCompleteRepair}>Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Work Order */}
      <Dialog open={workOrderDialog.showSparepartDialog} onOpenChange={workOrderDialog.setShowSparepartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Work Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={workOrderDialog.workOrderType} onValueChange={(val) => workOrderDialog.setWorkOrderType(val as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sparepart" id="sp" />
                <Label htmlFor="sp">Sparepart</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vendor" id="vn" />
                <Label htmlFor="vn">Vendor</Label>
              </div>
            </RadioGroup>
            {workOrderDialog.workOrderType === 'sparepart' && (
              <Input placeholder="Nama sparepart..." value={workOrderDialog.sparepartName} onChange={(e) => workOrderDialog.setSparepartName(e.target.value)} />
            )}
            <Textarea placeholder="Deskripsi..." value={workOrderDialog.sparepartDescription} onChange={(e) => workOrderDialog.setSparepartDescription(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => workOrderDialog.setShowSparepartDialog(false)}>Batal</Button>
            <Button onClick={handleCreateWorkOrder}>Buat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress */}
      <Dialog open={progressDialog.showProgressDialog} onOpenChange={progressDialog.setShowProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={progressDialog.newStatus} onValueChange={(val) => progressDialog.setNewStatus(val as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedang_diagnosa">Sedang Diagnosa</SelectItem>
                <SelectItem value="dalam_perbaikan">Dalam Perbaikan</SelectItem>
                <SelectItem value="tidak_dapat_diperbaiki">Tidak Dapat Diperbaiki</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Catatan..." value={progressDialog.progressNotes} onChange={(e) => progressDialog.setProgressNotes(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => progressDialog.setShowProgressDialog(false)}>Batal</Button>
            <Button onClick={handleUpdateProgress}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zoom Modal */}
      {showZoomReviewModal && ticket.type === 'zoom_meeting' && (
        <ZoomAdminReviewModal
          booking={ticket}
          onClose={() => setShowZoomReviewModal(false)}
          onUpdate={() => {
            setShowZoomReviewModal(false);
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}
    </motion.div>
  );
};
